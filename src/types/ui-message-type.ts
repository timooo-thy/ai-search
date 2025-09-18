import { UIMessage, UIMessagePart } from "ai";
import type { Message, Part, Chat } from "../../generated/prisma";
import z from "zod";

export const metadataSchema = z.object({
  time: z.string(),
});

export type MyMetadata = z.infer<typeof metadataSchema>;

export type MyUIMessage = UIMessage<
  MyMetadata,
  Record<string, never>,
  Record<string, never>
>;

export type MyUIMessagePart = UIMessagePart<
  Record<string, never>,
  Record<string, never>
>;

export type MyDBUIMessagePart = Omit<
  Part,
  "id" | "createdAt" | "updatedAt" | "messageId"
>;

export type MyDBUIMessagePartSelect = Pick<
  Part,
  | "type"
  | "text_text"
  | "reasoning_text"
  | "file_mediaType"
  | "file_filename"
  | "file_url"
  | "source_document_sourceId"
  | "source_document_mediaType"
  | "source_document_title"
  | "source_document_filename"
  | "source_url_sourceId"
  | "source_url_url"
  | "source_url_title"
  | "providerMetadata"
>;

export type MyDBUIChat = Chat & {
  messages: (Message & {
    parts: Part[];
  })[];
};
