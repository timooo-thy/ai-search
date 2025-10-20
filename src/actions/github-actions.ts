"use server";

import { Octokit } from "octokit";
import { getUserGithubPAT } from "./ui-message-actions";
import * as Sentry from "@sentry/nextjs";

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
    Sentry.logger.error("GitHub PAT validation failed", {
      error,
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
    Sentry.logger.error("Failed to fetch user repositories.", {
      error,
    });
    return [];
  }
}

export async function searchUserRepoWithContent(
  query: string,
  repo: string,
  maxResults: number = 5
): Promise<
  Array<{ name: string; path: string; url: string; content: string }>
> {
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
    if (!repo.includes("/")) {
      Sentry.logger.error("Invalid repository format. Expected 'owner/repo'.");
      return [];
    }

    const { data } = await octokit.rest.search.code({
      q: `${query} repo:${repo} in:file`,
      per_page: maxResults,
    });

    const [owner, repoName] = repo.split("/");

    const resultsWithContent = await Promise.all(
      data.items.map(async (item) => {
        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo: repoName,
            path: item.path,
          });

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

          return null;
        } catch (error) {
          Sentry.logger.error(`Failed to fetch content for ${item.path}`, {
            error,
          });
          return null;
        }
      })
    );

    return resultsWithContent.filter(
      (
        item
      ): item is { name: string; path: string; url: string; content: string } =>
        item !== null
    );
  } catch (error) {
    Sentry.logger.error("Failed to search and fetch code.", {
      error,
    });
    return [];
  }
}
