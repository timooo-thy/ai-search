import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Message } from "./types";

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages,
  loading,
  chatEndRef,
}: ChatMessagesProps) {
  return (
    <div className="flex flex-col flex-1 h-full">
      <ScrollArea className="flex-1 px-4 py-6 bg-background">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <Avatar className="mr-3 bg-muted text-muted-foreground flex justify-center items-center">
                  <span className="text-lg">AI</span>
                </Avatar>
              )}
              <Card
                className={`bg-card text-card-foreground max-w-[70%] px-4 py-2 rounded-lg shadow ${
                  msg.role === "user" && " ml-auto"
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {msg.time}
                  </span>
                </div>
              </Card>
              {msg.role === "user" && (
                <Avatar className="ml-3 bg-muted text-muted-foreground flex justify-center items-center">
                  <span className="text-lg">U</span>
                </Avatar>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <Skeleton className="h-12 w-32 rounded-lg bg-muted" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
