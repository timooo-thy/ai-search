import { Navbar } from "@/components/navbar";
import { SettingsForm } from "./components/settings-form";
import { checkUserGithubPAT, getUserRepos } from "@/actions/github-actions";
import { getUserProfile } from "@/actions/ui-message-actions";
import { getSession } from "@/hooks/use-session";

export default async function SettingsPage() {
  const user = await getSession();
  const [validGithubPAT, userInfo] = await Promise.all([
    checkUserGithubPAT(),
    getUserProfile(),
  ]);

  // Fetch repositories if GitHub PAT is valid
  let repositories: { name: string; description: string | null; url: string }[] = [];
  if (validGithubPAT) {
    try {
      const repos = await getUserRepos();
      repositories = repos.map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
      }));
    } catch {
      // Silently handle error - repos will be empty
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar user={user} />
      <SettingsForm
        user={userInfo}
        validGithubPAT={validGithubPAT}
        repositories={repositories}
      />
    </div>
  );
}
