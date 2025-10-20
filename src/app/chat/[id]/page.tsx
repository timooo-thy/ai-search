import { AppSidebar } from "@/app/chat/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/hooks/use-session";
import { loadChat } from "@/actions/ui-message-actions";
import ChatPanel from "../components/chat-panel";
import { notFound } from "next/navigation";
import { checkUserGithubPAT } from "@/actions/github-actions";
import * as Sentry from "@sentry/nextjs";

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  const { id } = await props.params;
  const hasValidGithubPAT = await checkUserGithubPAT();

  try {
    const previousMessages = await loadChat(id);
    return (
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <ChatPanel
            chatId={id}
            previousMessages={previousMessages}
            hasValidGithubPAT={hasValidGithubPAT}
            userName={user.name}
          />
        </SidebarInset>
      </SidebarProvider>
    );
  } catch (error) {
    Sentry.logger.error("Error loading chat:", {
      error,
    });
    notFound();
  }
}
