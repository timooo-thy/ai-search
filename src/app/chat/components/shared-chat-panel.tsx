"use client";

import { useRef } from "react";
import { ChatHeader } from "./chat-header";
import { MyUIMessage } from "@/types/ui-message-type";
import { SharedChatMessages } from "@/app/chat/components/shared-chat-messages";

type SharedChatPanelProps = {
  chatTitle: string;
  ownerName: string;
  messages: MyUIMessage[];
};

/**
 * Render the shared chat panel for viewing a shared conversation in read-only mode.
 *
 * @param chatTitle - The title of the shared chat
 * @param ownerName - The name of the chat owner
 * @param messages - The messages to display in the chat
 * @returns The shared chat panel element with header and messages
 */
export default function SharedChatPanel({
  chatTitle,
  ownerName,
  messages,
}: SharedChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader isReadOnly chatTitle={chatTitle} ownerName={ownerName} />
      <SharedChatMessages messages={messages} chatEndRef={chatEndRef} />
      <div className="p-4 border-t bg-muted/50">
        <p className="text-center text-sm text-muted-foreground">
          This is a shared chat. You are viewing it in read-only mode.
        </p>
      </div>
    </div>
  );
}
