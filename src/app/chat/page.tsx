import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { ChatHeader } from "./components/chat-header";
import { getSession } from "@/hooks/use-session";

export default async function CreateChatPage() {
  const user = await getSession();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <div className="flex flex-col h-full w-full">
        <ChatHeader />
        <div className="flex flex-col flex-1 h-full">
          <h1 className="text-2xl font-bold text-center mt-4 text-background">
            Start a New Chat
          </h1>
        </div>
      </div>
    </SidebarProvider>
  );
}
