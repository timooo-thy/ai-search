import { Navbar } from "@/components/navbar";
import { SettingsForm } from "./components/settings-form";
import { checkUserGithubPAT } from "@/actions/github-actions";
import { getUserProfile } from "@/actions/ui-message-actions";
import { getSession } from "@/hooks/use-session";

export default async function SettingsPage() {
  const validGithubPAT = await checkUserGithubPAT();
  const userInfo = await getUserProfile();
  const user = await getSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar user={user} />
      <SettingsForm user={userInfo} validGithubPAT={validGithubPAT} />
    </div>
  );
}
