import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { ChatHeader } from "./components/chat-header";
import { getSession } from "@/hooks/use-session";
import { NewChatInterface } from "./components/new-chat-interface";
import { checkUserGithubPAT } from "@/actions/github-actions";
import { getCompletedIndexedRepos } from "@/actions/ui-message-actions";

export default async function CreateChatPage() {
  const user = await getSession();
  const [hasValidGithubPAT, indexedRepos] = await Promise.all([
    checkUserGithubPAT(),
    getCompletedIndexedRepos(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <div className="flex flex-col h-screen w-full">
        <ChatHeader />
        <NewChatInterface
          hasValidGithubPAT={hasValidGithubPAT}
          indexedRepos={indexedRepos}
        />
      </div>
    </SidebarProvider>
  );
}
