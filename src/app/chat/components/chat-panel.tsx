"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { MyUIMessage } from "@/types/ui-message-type";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { ChatHeader } from "./chat-header";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

type ChatPanelProps = {
  chatId: string;
  previousMessages: MyUIMessage[];
  hasValidGithubPAT: boolean;
  userName: string;
};

/**
 * Render the chat panel for a conversation, handling message input, sending, and repository selection UI.
 *
 * Initialises the chat session using the provided chat ID, populates messages with `previousMessages`, processes an optional initial query from the URL (sending it once when ready), auto-scrolls to new messages, and displays header, message list, and input controls.
 *
 * @param chatId - The identifier for the chat session used to initialize routing and the chat transport
 * @param previousMessages - Initial messages to populate the chat view
 * @param hasValidGithubPAT - Flag indicating if the user has a valid GitHub Personal Access Token
 * @param userName - The name of the user
 * @returns The chat panel element containing the header, messages list, and input controls
 */
export default function ChatPanel({
  chatId,
  previousMessages,
  hasValidGithubPAT,
  userName,
}: ChatPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const hasProcessedInitialQueryRef = useRef(false);

  const [input, setInput] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }
    },
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id,
          },
        };
      },
    }),
    onError: (error) => {
      toast.error(
        error?.message || "An error occurred. Please try again later."
      );
    },
    messages: previousMessages,
  });

  const sendText = useCallback(
    (text: string) =>
      sendMessage({
        text,
        metadata: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      }),
    [sendMessage]
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      sendText(input);
      setInput("");
    }
  };

  const handleUISend = async (message: string) => {
    sendText(message);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  useEffect(() => {
    if (
      initialQuery &&
      sendText &&
      !hasProcessedInitialQueryRef.current &&
      status === "ready"
    ) {
      hasProcessedInitialQueryRef.current = true;

      sendText(initialQuery);

      router.replace(`/chat/${chatId}`);
    }
  }, [initialQuery, status, chatId, router, sendText]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <ChatMessages
        hasValidGithubPAT={hasValidGithubPAT}
        messages={messages}
        status={status}
        chatEndRef={chatEndRef}
        selectedRepo={selectedRepo}
        setSelectedRepo={setSelectedRepo}
        onSubmit={handleUISend}
        userName={userName}
      />
      <ChatInput
        input={input}
        status={status}
        onInputChange={handleInputChange}
        onSubmit={handleSend}
        onStop={stop}
        disableChatInput={status !== "ready" || !hasValidGithubPAT}
      />
    </div>
  );
}
