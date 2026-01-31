"use client";

import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MyUIMessage } from "@/types/ui-message-type";
import { MemoizedMarkdown } from "./memoized-markdown";
import { cn } from "@/lib/utils";
import { Weather } from "./weather";
import { CodeGraph } from "./code-graph/code-graph";

type SharedChatMessagesProps = {
  messages: MyUIMessage[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Renders the shared chat message list in read-only mode.
 *
 * @param messages - Array of UI messages to render
 * @param chatEndRef - Ref attached to the end marker element
 * @returns A React element that displays the rendered chat conversation
 */
export function SharedChatMessages({
  messages,
  chatEndRef,
}: SharedChatMessagesProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 sm:space-y-4">
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
                  "max-w-[85%]",
                  msg.role === "user" && "mb-6 sm:mb-10",
                )}
              >
                <Card
                  className={cn(
                    "bg-card text-card-foreground px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow min-h-12 sm:min-h-14",
                    "wrap-break-word overflow-hidden",
                    msg.role === "user" && "ml-auto",
                  )}
                >
                  {msg.parts.length > 0 &&
                    msg.parts.map((part, key) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <ScrollArea
                              className="flex flex-col space-y-1"
                              key={`${msg.id}-${key}`}
                            >
                              <MemoizedMarkdown id={key} content={part.text} />
                              <span className="text-xs text-muted-foreground mt-2">
                                {msg.metadata?.time}
                              </span>
                              <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                          );
                        case "data-weather":
                          return (
                            <Weather
                              key={`${msg.id}-weather-${key}`}
                              data={part.data}
                            />
                          );
                        case "data-codeGraph":
                          return (
                            <CodeGraph
                              key={`${msg.id}-codeGraph-${key}`}
                              graph={part.data}
                            />
                          );
                        case "data-repositories":
                          // Show repositories as a simple list in shared view
                          return (
                            <div
                              key={`${msg.id}-repositories-${key}`}
                              className="text-sm text-muted-foreground"
                            >
                              <p className="font-medium mb-2">Repositories:</p>
                              <ul className="list-disc list-inside">
                                {part.data?.details?.map(
                                  (
                                    repo: {
                                      name: string;
                                      description: string | null;
                                      url: string;
                                    },
                                    idx: number,
                                  ) => (
                                    <li key={idx}>{repo.name}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          );
                        default:
                          return null;
                      }
                    })}
                </Card>
              </div>
              {msg.role === "user" && (
                <Avatar className="bg-muted text-muted-foreground flex justify-center items-center shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                  <span className="text-sm sm:text-lg">U</span>
                </Avatar>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
