import { AppSidebar } from "@/app/chat/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/hooks/use-session";
import { loadChat } from "@/actions/ui-message-actions";
import ChatPanel from "../components/chat-panel";

export default async function ChatPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  const { id } = await props.params;
  const previousMessages = await loadChat(id);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <ChatPanel chatId={id} previousMessages={previousMessages} />
      </SidebarInset>
    </SidebarProvider>
  );
}
