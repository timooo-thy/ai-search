"use client";

import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { initialMessages, type Message } from "./types";

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [
      ...msgs,
      {
        id: Date.now(),
        role: "user" as const,
        content: input,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now() + 1,
          role: "assistant" as const,
          content: "This is a sample response.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };
  return (
    <div className="flex flex-col h-screen">
      <ChatHeader />
      <ChatMessages
        messages={messages}
        loading={loading}
        chatEndRef={chatEndRef}
      />
      <ChatInput
        input={input}
        loading={loading}
        onInputChange={handleInputChange}
        onSubmit={handleSend}
      />
    </div>
  );
}
