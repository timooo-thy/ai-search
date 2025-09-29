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
import Repositories from "./repositories";
import Link from "next/link";

interface ChatMessagesProps {
  messages: MyUIMessage[];
  status: ChatStatus;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  selectedRepo: string;
  setSelectedRepo: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (message: string) => Promise<void>;
  hasValidGithubPAT: boolean;
}

/**
 * Renders the chat message list including avatars, message parts (text, weather, repositories, tool outputs), expandable tool outputs, and assistant action controls.
 *
 * @param messages - Array of UI messages to render; each message may include multiple parts with types like `text`, `data-weather`, `data-repositories`, and tool call results.
 * @param status - Current chat status; shows a streaming loader when equal to `"streaming"`.
 * @param chatEndRef - Ref attached to the end marker element used to scroll to the latest message.
 * @param selectedRepo - Currently selected repository identifier used by the Repositories component.
 * @param setSelectedRepo - State setter to update the selected repository.
 * @param onSubmit - Async callback invoked by child repository UI to submit a message; receives the message string.
 * @param hasValidGithubPAT - Flag indicating whether the user has a valid GitHub Personal Access Token.
 * @returns A React element that displays the rendered chat conversation with interactive parts and controls.
 */
export function ChatMessages({
  messages,
  status,
  chatEndRef,
  selectedRepo,
  setSelectedRepo,
  onSubmit,
  hasValidGithubPAT,
}: ChatMessagesProps) {
  const pathname = usePathname();

  return hasValidGithubPAT ? (
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
                              key={`${msg.id}-${key}`}
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
                              key={`${msg.id}-weather-${key}`}
                              data={part.data}
                            />
                          );
                        case "data-repositories":
                          return (
                            <Repositories
                              key={`${msg.id}-repositories-${key}`}
                              repositories={part.data}
                              selectedRepo={selectedRepo}
                              setSelectedRepo={setSelectedRepo}
                              onSubmit={onSubmit}
                            />
                          );
                        case "tool-getRepositories":
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
                            .join("\n\n")
                        );
                        toast.success("Message copied to clipboard");
                      }}
                      onRewrite={() => console.log("Rewrite clicked")}
                      modelDetails={"gpt-4.1-mini"}
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
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-center p-10">
      <h2 className="text-2xl font-semibold mb-4">
        Connect your GitHub account
      </h2>
      <p className="text-muted-foreground mb-6">
        To use the chat features, please connect your GitHub account by
        providing a Personal Access Token (PAT).
      </p>
      <Link
        href="/settings"
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
      >
        Go to Settings
      </Link>
    </div>
  );
}
