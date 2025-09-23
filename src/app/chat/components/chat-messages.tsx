import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MyUIMessage } from "@/types/ui-message-type";
import { ChatStatus, getToolName } from "ai";
import { MemoizedMarkdown } from "./memoized-markdown";
import { MessageBottomBar } from "./message-bottom-bar";
import { PulseLoader } from "react-spinners";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Weather } from "./weather";

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
              <div
                className={cn(
                  "flex flex-col max-w-[70%]",
                  msg.role === "user" && "mb-10"
                )}
              >
                <Card
                  className={`bg-card text-card-foreground px-4 py-2 rounded-lg shadow min-w-xl min-h-14 ${
                    msg.role === "user" && " ml-auto"
                  }`}
                >
                  {msg.parts.length > 0 &&
                    msg.parts.map((part, key) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <div
                              className="flex flex-col"
                              key={`${msg.id}-${part}-${key}`}
                            >
                              <MemoizedMarkdown id={key} content={part.text} />
                              <span className="text-xs text-muted-foreground">
                                {msg.metadata?.time}
                              </span>
                            </div>
                          );
                        case "data-weather":
                          return (
                            <Weather
                              key={`${msg.id}-${part}-${key}`}
                              data={part.data}
                            />
                          );
                        case "tool-getWeatherInformation":
                          return (
                            <details
                              key={`tool-${part.toolCallId}`}
                              className="relative p-2 rounded-lg bg-background group"
                            >
                              <summary className="list-none cursor-pointer select-none flex justify-between items-center pr-2">
                                <span className="inline-flex items-center px-1 py-0.5 text-xs font-medium rounded-md font-mono text-zinc-900">
                                  {getToolName(part)}
                                </span>
                                {part.state === "output-available" ? (
                                  <span className="text-xs text-zinc-500 ml-2">
                                    Click to expand
                                  </span>
                                ) : (
                                  <span className="text-xs text-zinc-400 animate-pulse">
                                    calling...
                                  </span>
                                )}
                              </summary>
                              {part.state === "output-available" ? (
                                <div className="mt-4 bg-zinc-50 p-2">
                                  <pre className="font-mono text-xs">
                                    {JSON.stringify(part.output, null, 2)}
                                  </pre>
                                </div>
                              ) : null}
                            </details>
                          );
                        case "tool-getLocation": {
                          const callId = part.toolCallId;

                          switch (part.state) {
                            case "input-streaming":
                              return (
                                <div key={callId}>
                                  Preparing location request...
                                </div>
                              );
                            case "input-available":
                              return (
                                <div key={callId}>Getting location...</div>
                              );
                            case "output-available":
                              return (
                                <div key={callId}>
                                  Location: {part.output.location}
                                </div>
                              );
                            case "output-error":
                              return (
                                <div key={callId}>
                                  Error getting location: {part.errorText}
                                </div>
                              );
                          }
                        }

                        default:
                          return null;
                      }
                    })}
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
