import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { ChatHeader } from "./components/chat-header";
import { getSession } from "@/hooks/use-session";
import { NewChatInterface } from "./components/new-chat-interface";

export default async function CreateChatPage() {
  const user = await getSession();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <div className="flex flex-col h-screen w-full">
        <ChatHeader />
        <NewChatInterface />
      </div>
    </SidebarProvider>
  );
}
