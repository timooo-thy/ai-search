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
    <ScrollArea className="h-full">
      <div className="p-2 sm:p-6 sm:space-y-4">
        {messages?.map((msg) => (
          <div key={msg.id} className={msg.role === "assistant" ? "group" : ""}>
            <div
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <Avatar className="bg-muted text-muted-foreground flex justify-center items-center">
                  <span className="text-sm sm:text-lg">AI</span>
                </Avatar>
              )}
              <div
                className={cn(
                  "flex flex-col w-full",
                  "max-w-[85%] sm:max-w-[75%] md:max-w-[70%]",
                  msg.role === "user" && "mb-6 sm:mb-10"
                )}
              >
                <Card
                  className={cn(
                    "bg-card text-card-foreground px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow min-h-12 sm:min-h-14",
                    "break-words overflow-hidden",
                    msg.role === "user" && "ml-auto"
                  )}
                >
                  {msg.parts.length > 0 &&
                    msg.parts.map((part, key) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <div
                              className="flex flex-col space-y-1"
                              key={`${msg.id}-${part}-${key}`}
                            >
                              <MemoizedMarkdown id={key} content={part.text} />
                              <span className="text-xs text-muted-foreground mt-2">
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
                              className="relative p-2 rounded-lg bg-background group w-full"
                            >
                              <summary className="list-none cursor-pointer select-none flex justify-between items-center pr-2">
                                <span className="inline-flex items-center px-1 py-0.5 text-xs font-medium rounded-md font-mono text-zinc-900 truncate flex-1">
                                  {getToolName(part)}
                                </span>
                                {part.state === "output-available" ? (
                                  <span className="text-xs text-zinc-500 ml-2 shrink-0">
                                    Click to expand
                                  </span>
                                ) : (
                                  <span className="text-xs text-zinc-400 animate-pulse ml-2 shrink-0">
                                    calling...
                                  </span>
                                )}
                              </summary>
                              {part.state === "output-available" ? (
                                <div className="mt-4 bg-zinc-50 p-2 rounded overflow-x-auto">
                                  <pre className="font-mono text-xs whitespace-pre-wrap break-words">
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
                                <div key={callId} className="text-sm">
                                  Preparing location request...
                                </div>
                              );
                            case "input-available":
                              return (
                                <div key={callId} className="text-sm">
                                  Getting location...
                                </div>
                              );
                            case "output-available":
                              return (
                                <div
                                  key={callId}
                                  className="text-sm break-words"
                                >
                                  Location: {part.output.location}
                                </div>
                              );
                            case "output-error":
                              return (
                                <div
                                  key={callId}
                                  className="text-sm text-red-500 break-words"
                                >
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
                  <div className="mt-2">
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
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <Avatar className="bg-muted text-muted-foreground flex justify-center items-center shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                  <span className="text-sm sm:text-lg">U</span>
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
