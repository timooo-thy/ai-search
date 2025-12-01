"use server";

import { Octokit } from "octokit";
import { getUserGithubPAT } from "./ui-message-actions";
import * as Sentry from "@sentry/nextjs";
import { formatTreeStructure } from "@/lib/ui-message-util";

export async function checkUserGithubPAT() {
  try {
    const githubPAT = await getUserGithubPAT();
    if (!githubPAT) return false;
    return validateGitHubPAT(githubPAT);
  } catch {
    return false;
  }
}

export async function validateGitHubPAT(token: string) {
  const octokit = new Octokit({
    auth: token,
    request: {
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    },
  });
  try {
    await octokit.rest.users.getAuthenticated();
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: "github_pat_validation" },
    });
    return false;
  }
}

export async function getUserRepos() {
  let githubPAT: string | null;

  try {
    githubPAT = await getUserGithubPAT();
  } catch {
    return [];
  }

  if (!githubPAT) {
    return [];
  }

  const octokit = new Octokit({
    auth: githubPAT,
    request: {
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    },
  });

  try {
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 30,
      sort: "updated",
      direction: "desc",
      visibility: "all",
    });
    return data;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: "github_fetch_repos" },
    });
    return [];
  }
}

export async function searchUserRepoWithContent(
  query: string,
  repo: string,
  maxResults: number = 6
): Promise<
  Array<{ name: string; path: string; url: string; content: string }>
> {
  return Sentry.startSpan(
    {
      op: "github.api",
      name: "Search Repository Code",
    },
    async (span) => {
      let githubPAT: string | null;

      try {
        githubPAT = await getUserGithubPAT();
      } catch {
        return [];
      }

      if (!githubPAT) {
        return [];
      }

      const octokit = new Octokit({
        auth: githubPAT,
        request: {
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        },
      });

      try {
        const repoParts = repo.split("/");
        if (repoParts.length !== 2 || !repoParts[0] || !repoParts[1]) {
          Sentry.captureMessage("Invalid repository format", {
            level: "error",
            tags: { context: "github_search_code" },
          });
          return [];
        }

        const [owner, repoName] = repoParts;

        span.setAttribute("repo.owner", owner);
        span.setAttribute("repo.name", repoName);
        span.setAttribute("search.query", query);

        // Split into individual search terms (max 3)
        const searchTerms = query
          .split(/\s+/)
          .filter((term) => term.length > 1)
          .slice(0, 3);

        span.setAttribute("search.terms_count", searchTerms.length);

        // Deduplicate results by file path
        const allResults = new Map<
          string,
          { name: string; path: string; url: string; content: string }
        >();

        for (const term of searchTerms) {
          try {
            const searchQuery = `${term} repo:${repo}`;

            const { data } = await octokit.rest.search.code({
              q: searchQuery,
              per_page: maxResults,
            });

            const resultsWithContent = await Promise.all(
              data.items.slice(0, maxResults).map(async (item) => {
                // Skip if we already have this file
                if (allResults.has(item.path)) {
                  return null;
                }

                try {
                  const { data: fileData } =
                    await octokit.rest.repos.getContent({
                      owner,
                      repo: repoName,
                      path: item.path,
                    });

                  // Skip if it's a directory (returns array) or not a file
                  if (Array.isArray(fileData)) {
                    return null;
                  }

                  // Only process files
                  if (fileData.type !== "file") {
                    return null;
                  }

                  // Handle regular files with base64 content
                  if ("content" in fileData && fileData.content) {
                    const decodedContent = Buffer.from(
                      fileData.content,
                      "base64"
                    ).toString("utf-8");

                    return {
                      name: item.name,
                      path: item.path,
                      url: item.html_url,
                      content: decodedContent,
                    };
                  }

                  // Handle large files (>1MB)
                  if (
                    "download_url" in fileData &&
                    fileData.download_url &&
                    "size" in fileData &&
                    typeof fileData.size === "number" &&
                    fileData.size < 500000 // Only fetch files under 500KB via download
                  ) {
                    try {
                      const response = await fetch(fileData.download_url, {
                        headers: {
                          Authorization: `token ${githubPAT}`,
                        },
                      });
                      if (response.ok) {
                        const content = await response.text();
                        return {
                          name: item.name,
                          path: item.path,
                          url: item.html_url,
                          content,
                        };
                      }
                    } catch (fetchError) {
                      Sentry.captureException(fetchError, {
                        tags: { context: "github_fetch_large_file" },
                        extra: {
                          path: item.path,
                          download_url: fileData.download_url,
                        },
                      });
                    }
                  }

                  Sentry.logger.warn(
                    Sentry.logger
                      .fmt`File content not available for ${item.path}`
                  );

                  return null;
                } catch (error) {
                  Sentry.captureException(error, {
                    tags: { context: "github_fetch_file_content" },
                    extra: { path: item.path },
                  });
                  return null;
                }
              })
            );

            resultsWithContent.forEach((result) => {
              if (result && !allResults.has(result.path)) {
                allResults.set(result.path, result);
              }
            });

            if (allResults.size >= maxResults) {
              break;
            }
          } catch (error) {
            Sentry.captureException(error, {
              tags: { context: "github_search_code" },
              extra: { term, repo },
            });
            continue;
          }
        }

        const finalResults = Array.from(allResults.values()).slice(
          0,
          maxResults
        );

        span.setAttribute("search.results_count", finalResults.length);

        return finalResults;
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "github_search_code" },
        });
        return [];
      }
    }
  );
}

export async function getRepoStructure(repo: string) {
  return Sentry.startSpan(
    {
      op: "github.api",
      name: "Get Repository Tree Structure",
    },
    async (span) => {
      let githubPAT: string | null;

      try {
        githubPAT = await getUserGithubPAT();
      } catch {
        return null;
      }

      if (!githubPAT) {
        return null;
      }

      const octokit = new Octokit({
        auth: githubPAT,
        request: {
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        },
      });

      try {
        const repoParts = repo.split("/");
        if (repoParts.length !== 2 || !repoParts[0] || !repoParts[1]) {
          Sentry.captureMessage("Invalid repository format", {
            level: "error",
            tags: { context: "github_fetch_repo_structure" },
          });
          return null;
        }

        const [owner, repoName] = repoParts;

        span.setAttribute("repo.owner", owner);
        span.setAttribute("repo.name", repoName);

        const { data: repoData } = await octokit.rest.repos.get({
          owner,
          repo: repoName,
        });

        // Get the full tree recursively
        const { data: treeData } = await octokit.rest.git.getTree({
          owner,
          repo: repoName,
          tree_sha: repoData.default_branch,
          recursive: "true",
        });

        span.setAttribute("tree.item_count", treeData.tree.length);

        const paths = treeData.tree
          .filter((item) => item.type === "blob")
          .map((item) => item.path);

        return formatTreeStructure(paths);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "github_fetch_repo_structure" },
        });
        return null;
      }
    }
  );
}
