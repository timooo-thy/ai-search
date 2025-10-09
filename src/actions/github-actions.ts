"use server";

import { Octokit } from "octokit";
import { getUserGithubPAT } from "./ui-message-actions";

export async function checkUserGithubPAT() {
  const githubPAT = await getUserGithubPAT();

  if (!githubPAT) {
    return false;
  }

  const octokit = new Octokit({
    auth: githubPAT,
    request: {
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    },
  });
  try {
    await octokit.rest.users.getAuthenticated();
    return true;
  } catch (error: any) {
    console.error("Token is invalid or expired.", {
      status: error?.status,
      message: error?.message,
    });
    return false;
  }
}

export async function getUserRepos() {
  const githubPAT = await getUserGithubPAT();

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
    const { data } = await octokit.request("GET /user/repos", {
      per_page: 30,
      sort: "updated",
      direction: "desc",
      visibility: "all",
    });
    return data;
  } catch (error: any) {
    console.error("Failed to fetch user repositories.", {
      status: error?.status,
      message: error?.message,
    });
    return [];
  }
}
