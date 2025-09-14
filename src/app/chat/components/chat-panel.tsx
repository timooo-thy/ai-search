"use client";

import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { useSearchParams } from "next/navigation";
import { getChat } from "@/actions/ui-message-actions";
import { MyDBUIChat } from "@/types/ui-message-type";

export default function ChatPanel() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id");
  const [chat, setChat] = useState<MyDBUIChat | undefined>(undefined);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) {
      setChat(undefined);
      return;
    }

    const fetchMessages = async () => {
      const chat = await getChat(chatId);
      if (chat) {
        setChat(chat);
      }
    };

    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    // TODO: Implement sending message logic
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };
  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <ChatMessages chat={chat} loading={loading} chatEndRef={chatEndRef} />
      <ChatInput
        input={input}
        loading={loading}
        onInputChange={handleInputChange}
        onSubmit={handleSend}
      />
    </div>
  );
}
