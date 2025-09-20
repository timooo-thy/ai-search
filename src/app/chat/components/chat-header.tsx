import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";

export function ChatHeader() {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b bg-card text-card-foreground">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
        <Tabs defaultValue="chat">
          <TabsList className="bg-muted">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>
        <ModeToggle />
      </div>
    </div>
  );
}
