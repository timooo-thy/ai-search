"use client";

import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { MyUIMessage } from "@/types/ui-message-type";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatHeader } from "./chat-header";
import { toast } from "sonner";

type ChatPanelProps = {
  chatId: string;
  previousMessages: MyUIMessage[];
  userId: string;
};

export default function ChatPanel({
  chatId,
  previousMessages,
  userId,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id,
            userId,
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
