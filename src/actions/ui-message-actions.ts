"use server";

import prisma from "@/lib/prisma";
import { MyUIMessage } from "../types/ui-message-type";
import {
  jsonOrDbNull,
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

/**
 * Insert or update UI messages and their associated parts for a chat in the database.
 *
 * Upserts each provided UI message by id: existing messages have their parts replaced, and missing messages are created.
 *
 * @param uiMessages - The array of UI-formatted messages to upsert (each must include parts and an id).
 * @param chatId - The id of the chat to associate the messages with.
 * @throws Error if the user is not authenticated or if a message does not belong to the specified chat or user.
 */
export async function upsertMessages(
  uiMessages: MyUIMessage[],
  chatId: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to create a chat.");
  }

  await prisma.$transaction(async (tx) => {
    const chat = await tx.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
      select: { id: true },
    });
    if (!chat) {
      throw new Error("Forbidden: chat does not belong to this user.");
    }

    for (const uiMessage of uiMessages) {
      const existing = await tx.message.findUnique({
        where: { id: uiMessage.id },
        select: { chatId: true, chat: { select: { userId: true } } },
      });

      if (
        existing &&
        (existing.chatId !== chatId || existing.chat.userId !== session.user.id)
      ) {
        throw new Error(
          "Forbidden: message does not belong to this chat or user"
        );
      }

      const normalisedParts = mapUIMessagePartsToDBParts(uiMessage.parts).map(
        (part) => ({
          ...part,
          providerMetadata: jsonOrDbNull(part.providerMetadata),
          tool_getWeatherInformation_input: jsonOrDbNull(
            part.tool_getWeatherInformation_input
          ),
          tool_getWeatherInformation_output: jsonOrDbNull(
            part.tool_getWeatherInformation_output
          ),
          tool_getRepositories_input: jsonOrDbNull(
            part.tool_getRepositories_input
          ),
          tool_getRepositories_output: jsonOrDbNull(
            part.tool_getRepositories_output
          ),
          data_repositories_details: jsonOrDbNull(
            part.data_repositories_details
          ),
        })
      );

      await tx.message.upsert({
        where: { id: uiMessage.id },
        update: {
          parts: {
            deleteMany: {},
            create: normalisedParts,
          },
        },
        create: {
          id: uiMessage.id,
          chatId,
          role: uiMessage.role,
          parts: {
            create: normalisedParts,
          },
        },
      });

      await tx.chat.update({
        where: {
          id: chatId,
          userId: session.user.id,
        },
        data: {
          updatedAt: new Date(),
        },
      });
    }
  });
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
    include: {
      messages: { include: { parts: true }, orderBy: { createdAt: "asc" } },
    },
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

  const chat = await prisma.chat.findFirst({
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
    console.error("Error deleting chat:", error);
    throw new Error("Failed to delete chat.");
  }
}
