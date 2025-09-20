import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MyUIMessage } from "@/types/ui-message-type";
import { ChatStatus } from "ai";
import { MemoizedMarkdown } from "./memoized-markdown";
import { MessageBottomBar } from "./message-bottom-bar";
import { PulseLoader } from "react-spinners";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  return (
    <ScrollArea className="p-6 h-full">
      <div className="space-y-4">
        {messages?.map((msg) => (
          <div key={msg.id} className={msg.role === "assistant" ? "group" : ""}>
            <div
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <Avatar className="mr-3 bg-muted text-muted-foreground flex justify-center items-center">
                  <span className="text-lg">AI</span>
                </Avatar>
              )}
              <div className="flex flex-col max-w-[70%]">
                <Card
                  className={`bg-card text-card-foreground px-4 py-2 rounded-lg shadow ${
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
                {msg.role === "assistant" && (
                  <MessageBottomBar
                    onShare={() => {
                      navigator.clipboard.writeText(
                        process.env.NEXT_PUBLIC_BASE_URL + pathname
                      );
                      toast.success("Link copied. Paste to share.");
                    }}
                    onCopy={() => {
                      navigator.clipboard.writeText(
                        msg.parts
                          .map((part) =>
                            part.type === "text" ? part.text : ""
                          )
                          .join("")
                      );
                      toast.success("Message copied to clipboard");
                    }}
                    onRewrite={() => console.log("Rewrite clicked")}
                    modelDetails={"sonar-pro"}
                  />
                )}
              </div>
              {msg.role === "user" && (
                <Avatar className="ml-3 bg-muted text-muted-foreground flex justify-center items-center">
                  <span className="text-lg">U</span>
                </Avatar>
              )}
            </div>
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
  );
}
