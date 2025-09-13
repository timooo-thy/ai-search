import { AppSidebar } from "@/app/chat/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ChatPanel from "./components/chat-panel";
import { getSession } from "@/hooks/use-session";

export default async function ChatPage() {
  const user = await getSession();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <ChatPanel />
      </SidebarInset>
    </SidebarProvider>
  );
}
