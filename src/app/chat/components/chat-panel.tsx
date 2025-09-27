"use client";

import { useEffect, useRef, useState } from "react";
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
};

/**
 * Render the chat panel for a conversation, handling message input, sending, and repository selection UI.
 *
 * Initializes the chat session using the provided chat ID, populates messages with `previousMessages`, processes an optional initial query from the URL (sending it once when ready), auto-scrolls to new messages, and displays header, message list, and input controls.
 *
 * @param chatId - The identifier for the chat session used to initialize routing and the chat transport
 * @param previousMessages - Initial messages to populate the chat view
 * @returns The chat panel element containing the header, messages list, and input controls
 */
export default function ChatPanel({
  chatId,
  previousMessages,
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

  useEffect(() => {
    if (
      initialQuery &&
      sendMessage &&
      !hasProcessedInitialQueryRef.current &&
      status === "ready"
    ) {
      hasProcessedInitialQueryRef.current = true;

      sendMessage({
        text: decodeURIComponent(initialQuery),
        metadata: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      });

      router.replace(`/chat/${chatId}`);
    }
  }, [initialQuery, sendMessage, status, chatId, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      sendMessage({
        text: input,
        metadata: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      });
      setInput("");
    }
  };

  const handleUISend = async (message: string) => {
    sendMessage({
      text: message,
      metadata: {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <ChatMessages
        messages={messages}
        status={status}
        chatEndRef={chatEndRef}
        selectedRepo={selectedRepo}
        setSelectedRepo={setSelectedRepo}
        onSubmit={handleUISend}
      />
      <ChatInput
        input={input}
        status={status}
        onInputChange={handleInputChange}
        onSubmit={handleSend}
        onStop={stop}
      />
    </div>
  );
}
