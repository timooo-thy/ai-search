"use server";

import prisma from "@/lib/prisma";
import { MyUIMessage } from "../types/ui-message-type";
import { Prisma } from "../../generated/prisma";
import {
  mapDBPartToUIMessagePart,
  mapUIMessagePartsToDBParts,
} from "@/lib/ui-message-util";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Create a new chat
export async function createChat(title: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to create a chat.");
  }

  return await prisma.chat.create({
    data: {
      userId: session.user.id,
      title,
    },
  });
}

// Save UIMessages to the database
export async function saveNewMessages(
  uiMessages: MyUIMessage[],
  chatId: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to create a chat.");
  }
  console.log("Messages to save:", uiMessages);
  for (const uiMessage of uiMessages) {
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
  console.log("All messages saved.");
}

// Get all messages from a chat as UIMessages
export async function getChatMessagesById(
  chatId: string
): Promise<MyUIMessage[] | undefined> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to create a chat.");
  }

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: session.user.id },
    include: { messages: { include: { parts: true } } },
    orderBy: { createdAt: "asc" },
  });

  return chat?.messages.map((message) => ({
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to create a chat.");
  }

  const chat = await prisma.chat.findUnique({
    where: { id: chatId, userId: session.user.id },
    include: {
      messages: {
        include: {
          parts: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chat) {
    throw new Error("Chat not found.");
  }

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
export async function getUserChats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to create a chat.");
  }

  return await prisma.chat.findMany({
    where: { userId: session.user.id },
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
export async function getUserChatTitles() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to create a chat.");
  }

  return await prisma.chat.findMany({
    where: { userId: session.user.id },
    select: { title: true, id: true },
    orderBy: { updatedAt: "desc" },
  });
}

// Delete a chat and all its messages
export async function deleteChat(chatId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to create a chat.");
  }

  try {
    await prisma.chat.delete({
      where: { id: chatId, userId: session.user.id },
    });
  } catch (error) {
    throw new Error("Failed to delete chat.");
  }
}
