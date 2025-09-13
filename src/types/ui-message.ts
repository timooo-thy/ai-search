import { UIMessage } from "ai";
import type {
  Message,
  MessagePart,
  Conversation,
} from "../../generated/prisma";
import z from "zod";

const metadataSchema = z.object({
  time: z.string(),
});

type MyMetadata = z.infer<typeof metadataSchema>;

export type ChatUIMessage = UIMessage<MyMetadata>;

export type MessageWithParts = Message & {
  parts: MessagePart[];
};

export type ConversationWithMessages = Conversation & {
  messages: MessageWithParts[];
};

export function prismaMessageToUIMessage(
  message: MessageWithParts
): ChatUIMessage {
  return {
    id: message.id,
    role: message.role,
    metadata: {
      time: message.createdAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    parts: message.parts
      .sort((a: MessagePart, b: MessagePart) => a.order - b.order)
      .map((part: MessagePart) => {
        const basePart = {
          state: part.state as "streaming" | "done" | undefined,
        };
        switch (part.type) {
          case "text":
            return {
              type: "text" as const,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              text: (part.content as any).text,
              ...basePart,
            };
          default:
            throw new Error(`Unknown part type: ${part.type}`);
        }
      }),
  };
}

export function uiMessageToPrismaMessage(
  uiMessage: ChatUIMessage,
  conversationId: string
): {
  message: Omit<Message, "id" | "createdAt" | "updatedAt">;
  parts: Omit<MessagePart, "id" | "messageId" | "createdAt">[];
} {
  return {
    message: {
      conversationId,
      role: uiMessage.role,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: uiMessage.metadata as any,
    },
    parts: uiMessage.parts.map((part, index) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: part.type.replace("-", "_") as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: part as any,
      order: index,
      state: "state" in part ? part.state || null : null,
    })),
  };
}
