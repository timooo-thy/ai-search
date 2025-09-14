"use server";

import prisma from "@/lib/prisma";
import { MyUIMessage, MyDBUIMessagePart } from "../types/ui-message-type";
import { Prisma } from "../../generated/prisma";
import {
  mapDBPartToUIMessagePart,
  mapUIMessagePartsToDBParts,
} from "@/lib/ui-message-util";

// Create a new chat
export async function createChat(userId: string, title: string) {
  return await prisma.chat.create({
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
                  text_text: "How can I assist you today?",
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
  uiMessage: MyUIMessage,
  chatId: string
): Promise<MyDBUIMessagePart[]> {
  const message = await prisma.message.create({
    data: {
      id: uiMessage.id,
      chatId,
      role: uiMessage.role,
      parts: {
        create: mapUIMessagePartsToDBParts(uiMessage.parts).map((part) => ({
          ...part,
          providerMetadata:
            part.providerMetadata !== null
              ? (part.providerMetadata as Prisma.InputJsonValue)
              : Prisma.DbNull,
        })),
      },
    },
    include: {
      parts: true,
    },
  });

  return message.parts;
}

// Get all messages from a chat as UIMessages
export async function getChatMessagesById(
  chatId: string
): Promise<MyUIMessage[]> {
  const messages = await prisma.message.findMany({
    where: { chatId },
    include: { parts: true },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    metadata: { time: message.createdAt.toLocaleTimeString() },
    parts: message.parts
      .sort((a, b) => a.order - b.order)
      .map(mapDBPartToUIMessagePart),
  }));
}

// Get a chat with all its messages
export async function getChat(chatId: string) {
  return await prisma.chat.findUnique({
    where: { id: chatId },
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

// Get all chats for a user
export async function getUserChats(userId: string) {
  return await prisma.chat.findMany({
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

// Get all recent chat titles for a user
export async function getUserChatTitles(userId: string) {
  return await prisma.chat.findMany({
    where: { userId },
    select: { title: true, id: true },
    orderBy: { updatedAt: "desc" },
  });
}

// Delete a chat and all its messages
export async function deleteChat(chatId: string) {
  return await prisma.chat.delete({
    where: { id: chatId },
  });
}
