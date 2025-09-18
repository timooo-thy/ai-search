import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MyUIMessage } from "@/types/ui-message-type";
import { ChatStatus } from "ai";
import { MemoizedMarkdown } from "./memoized-markdown";
import { PulseLoader } from "react-spinners";

interface ChatMessagesProps {
  messages: MyUIMessage[];
  status: ChatStatus;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages,
  status,
  chatEndRef,
}: ChatMessagesProps) {
  return (
    <div className="flex flex-col flex-1 h-full">
      <ScrollArea className="flex-1 px-4 py-6 bg-background">
        <div className="space-y-4">
          {messages?.map((msg) => (
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
                {msg.parts.length > 0 &&
                  msg.parts.map(
                    (part, key) =>
                      part.type === "text" && (
                        <div
                          className="flex flex-col"
                          key={`${msg.id}-${part}-${key}`}
                        >
                          <MemoizedMarkdown id={key} content={part.text} />
                          <span className="text-xs text-muted-foreground">
                            {msg.metadata?.time}
                          </span>
                        </div>
                      )
                  )}
              </Card>
              {msg.role === "user" && (
                <Avatar className="ml-3 bg-muted text-muted-foreground flex justify-center items-center">
                  <span className="text-lg">U</span>
                </Avatar>
              )}
            </div>
          ))}
          {status === "streaming" && (
            <div className="ml-12">
              <PulseLoader size={6} color="#4a2e2d" />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
