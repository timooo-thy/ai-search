"use server";

import { Octokit } from "octokit";
import { getUserGithubPAT } from "./ui-message-actions";

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
    console.error("Token is invalid or expired.", error);
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
    console.error("Failed to fetch user repositories.", error);
    return [];
  }
}
