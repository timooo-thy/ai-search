"use client";

import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { useSearchParams } from "next/navigation";
import { getConversation } from "@/server/ui-message-service";
import { ConversationWithMessages } from "@/types/ui-message";

export default function ChatPanel() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id");
  const [conversation, setConversation] = useState<
    ConversationWithMessages | undefined
  >(undefined);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const fetchMessages = async () => {
      const conversation = await getConversation(conversationId);
      if (conversation) {
        setConversation(conversation);
      }
    };

    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

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
      <ChatMessages
        conversation={conversation}
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
