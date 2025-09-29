"use server";

import { Octokit } from "octokit";
import { getUserGithubPAT } from "./ui-message-actions";

export async function checkUserGithubPAT() {
  const githubPAT = await getUserGithubPAT();

  if (!githubPAT) {
    return false;
  }

  const octokit = new Octokit({ auth: githubPAT });
  try {
    await octokit.rest.users.getAuthenticated();
    return true;
  } catch (error) {
    console.log("Token is invalid or expired.", error);
    return false;
  }
}

export async function getUserRepos() {
  const githubPAT = await getUserGithubPAT();

  if (!githubPAT) {
    return false;
  }

  const octokit = new Octokit({
    auth: githubPAT,
  });

  const response = await octokit.request("GET /user/repos", {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  return response;
}
