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

export default function ChatPanel({
  chatId,
  previousMessages,
}: ChatPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const hasProcessedInitialQueryRef = useRef(false);

  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, addToolResult } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }

      if (toolCall.toolName === "getLocation") {
        const cities = ["New York", "Los Angeles", "Chicago", "San Francisco"];

        addToolResult({
          tool: "getLocation",
          toolCallId: toolCall.toolCallId,
          output: {
            location: cities[Math.floor(Math.random() * cities.length)],
          },
        });
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
