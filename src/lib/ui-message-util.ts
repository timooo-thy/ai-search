import {
  MyDBUIMessagePart,
  MyDBUIMessagePartSelect,
  MyUIMessagePart,
} from "@/types/ui-message-type";
import { MessagePartType, Prisma } from "../../generated/prisma";
import type { ProviderMetadata } from "ai";

export const mapUIMessagePartsToDBParts = (
  messageParts: MyUIMessagePart[]
): MyDBUIMessagePart[] => {
  return messageParts.map((part, index) => {
    const basePart: Omit<MyDBUIMessagePart, "type"> = {
      order: index,
      text_text: null,
      reasoning_text: null,
      file_mediaType: null,
      file_filename: null,
      file_url: null,
      source_document_sourceId: null,
      source_document_mediaType: null,
      source_document_title: null,
      source_document_filename: null,
      source_url_sourceId: null,
      source_url_url: null,
      source_url_title: null,
      providerMetadata: null,
    };

    switch (part.type) {
      case "step-start":
        return {
          ...basePart,
          type: MessagePartType.step_start,
          order: index,
        };
      case "text":
        return {
          ...basePart,
          type: MessagePartType.text,
          order: index,
          text_text: part.text,
          providerMetadata: part.providerMetadata as Prisma.JsonValue | null,
        };
      case "reasoning":
        return {
          ...basePart,
          type: MessagePartType.reasoning,
          order: index,
          reasoning_text: part.text,
          providerMetadata: part.providerMetadata as Prisma.JsonValue | null,
        };
      case "file":
        return {
          ...basePart,
          type: MessagePartType.file,
          order: index,
          file_mediaType: part.mediaType,
          file_filename: part.filename || null,
          file_url: part.url,
          providerMetadata: part.providerMetadata as Prisma.JsonValue | null,
        };
      case "source-document":
        return {
          ...basePart,
          type: MessagePartType.source_document,
          order: index,
          source_document_sourceId: part.sourceId,
          source_document_mediaType: part.mediaType,
          source_document_title: part.title || null,
          source_document_filename: part.filename || null,
          providerMetadata: part.providerMetadata as Prisma.JsonValue | null,
        };
      case "source-url":
        return {
          ...basePart,
          type: MessagePartType.source_url,
          order: index,
          source_url_sourceId: part.sourceId,
          source_url_url: part.url,
          source_url_title: part.title || null,
          providerMetadata: part.providerMetadata as Prisma.JsonValue | null,
        };
      default:
        throw new Error(`Unsupported part type: ${part}`);
    }
  });
};

export const mapDBPartToUIMessagePart = (
  part: MyDBUIMessagePartSelect
): MyUIMessagePart => {
  const providerMetadata = part.providerMetadata
    ? (part.providerMetadata as ProviderMetadata)
    : undefined;

  switch (part.type) {
    case "step_start":
      return {
        type: "step-start",
      };
    case "text":
      return {
        type: part.type,
        text: part.text_text!,
        providerMetadata,
      };
    case "reasoning":
      return {
        type: part.type,
        text: part.reasoning_text!,
        providerMetadata,
      };
    case "file":
      return {
        type: part.type,
        mediaType: part.file_mediaType!,
        filename: part.file_filename!,
        url: part.file_url!,
      };
    case "source_document":
      return {
        type: "source-document",
        sourceId: part.source_document_sourceId!,
        mediaType: part.source_document_mediaType!,
        title: part.source_document_title!,
        filename: part.source_document_filename!,
        providerMetadata,
      };
    case "source_url":
      return {
        type: "source-url",
        sourceId: part.source_url_sourceId!,
        url: part.source_url_url!,
        title: part.source_url_title!,
        providerMetadata,
      };

    default:
      throw new Error(`Unsupported part type: ${part.type}`);
  }
};
