import { InferUITools, UIMessage, UIMessagePart } from "ai";
import type { Message, Part, Chat } from "../../generated/prisma";
import z from "zod";
import { tools } from "@/ai/tools";
export const metadataSchema = z.object({
  time: z.string(),
});

export type MyMetadata = z.infer<typeof metadataSchema>;

export type MyUIMessage = UIMessage<MyMetadata, MyDataPart, MyToolSet>;

export const dataPartSchema = z.object({
  weather: z.object({
    weather: z
      .enum([
        "Thunderstorm",
        "Drizzle",
        "Rain",
        "Snow",
        "Mist",
        "Smoke",
        "Haze",
        "Dust",
        "Fog",
        "Sand",
        "Ash",
        "Squall",
        "Tornado",
        "Clear",
        "Clouds",
        "Unknown",
      ])
      .optional(),
    location: z.string().optional(),
    temperature: z.number().optional(),
    loading: z.boolean().default(true),
  }),
});

export type MyDataPart = z.infer<typeof dataPartSchema>;

export type MyToolSet = InferUITools<ReturnType<typeof tools>>;

export type MyUIMessagePart = UIMessagePart<MyDataPart, MyToolSet>;

export type MyDBUIMessagePart = Omit<
  Part,
  "id" | "createdAt" | "updatedAt" | "messageId"
>;

export type MyDBUIChat = Chat & {
  messages: (Message & {
    parts: Part[];
  })[];
};
