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
    },
  });
}

// Save UIMessages to the database
export async function saveNewMessages(
  uiMessages: MyUIMessage[],
  chatId: string
) {
  const existingMessages = await prisma.message.findMany({
    where: { chatId },
    select: { id: true },
  });

  const existingIds = new Set(existingMessages.map((msg) => msg.id));

  const newMessages = uiMessages.filter((msg) => !existingIds.has(msg.id));

  if (newMessages.length === 0) {
    return [];
  }

  for (const uiMessage of newMessages) {
    await prisma.message.create({
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
  }
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
export async function loadChat(chatId: string) {
  if (!chatId) {
    return [];
  }

  const chat = await prisma.chat.findUnique({
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

  const previousMessages: MyUIMessage[] =
    chat?.messages.map((msg) => {
      return {
        id: msg.id,
        role: msg.role,
        parts: msg.parts.map((part) => mapDBPartToUIMessagePart(part)),
        metadata: {
          time: msg.createdAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      };
    }) || [];

  return previousMessages;
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
