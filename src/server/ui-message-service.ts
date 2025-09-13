"use server";

import prisma from "@/lib/prisma";
import {
  ChatUIMessage,
  MessageWithParts,
  prismaMessageToUIMessage,
} from "../types/ui-message";

// Create a new conversation
export async function createConversation(userId: string, title: string) {
  return await prisma.conversation.create({
    data: {
      userId,
      title,
      messages: {
        create: [
          {
            role: "assistant",
            parts: {
              create: [
                {
                  type: "text",
                  content: { text: "How can I assist you today?" },
                  order: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });
}

// Save a UIMessage to the database
export async function saveMessage(
  uiMessage: ChatUIMessage,
  conversationId: string
): Promise<MessageWithParts> {
  return (await prisma.message.create({
    data: {
      id: uiMessage.id,
      conversationId,
      role: uiMessage.role,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: (uiMessage.metadata as any) || null,
      parts: {
        create: uiMessage.parts.map((part, index) => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: part.type.replace("-", "_") as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: part as any,
          order: index,
          state: "state" in part ? part.state || null : null,
        })),
      },
    },
    include: {
      parts: true,
    },
  })) as MessageWithParts;
}

// Get all messages from a conversation as UIMessages
export async function getConversationMessagesById(
  conversationId: string
): Promise<ChatUIMessage[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { parts: true },
    orderBy: { createdAt: "asc" },
  });

  return messages.map(prismaMessageToUIMessage);
}

// Get a conversation with all its messages
export async function getConversation(conversationId: string) {
  return await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        include: {
          parts: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// Get all conversations for a user
export async function getUserConversations(userId: string) {
  return await prisma.conversation.findMany({
    where: { userId },
    include: {
      messages: {
        include: {
          parts: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Get all recent conversation titles for a user
export async function getUserConversationTitles(userId: string) {
  return await prisma.conversation.findMany({
    where: { userId },
    select: { title: true, id: true },
    orderBy: { updatedAt: "desc" },
  });
}

// Delete a conversation and all its messages
export async function deleteConversation(conversationId: string) {
  return await prisma.conversation.delete({
    where: { id: conversationId },
  });
}

// Create a text UIMessage
export async function createTextMessage(
  id: string,
  role: "system" | "user" | "assistant",
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any
): Promise<ChatUIMessage> {
  return {
    id,
    role,
    metadata,
    parts: [
      {
        type: "text",
        text,
      },
    ],
  };
}
