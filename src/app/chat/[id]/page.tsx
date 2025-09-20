import { AppSidebar } from "@/app/chat/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/hooks/use-session";
import { loadChat } from "@/actions/ui-message-actions";
import ChatPanel from "../components/chat-panel";
import { notFound } from "next/navigation";

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  const { id } = await props.params;

  try {
    const previousMessages = await loadChat(id, user.id);
    return (
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <ChatPanel
            chatId={id}
            previousMessages={previousMessages}
            userId={user.id}
          />
        </SidebarInset>
      </SidebarProvider>
    );
  } catch (error) {
    notFound();
  }
}
