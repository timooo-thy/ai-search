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
  repositories: z.object({
    details: z.array(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        url: z.string().url(),
      })
    ),
    loading: z.boolean().default(true),
  }),
  codeGraph: z
    .object({
      nodes: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          type: z.enum(["file", "function", "class", "component"]).optional(),
          filePath: z.string().optional(),
          codeSnippet: z.string().optional(),
          description: z.string().optional(),
        })
      ),
      edges: z.array(
        z.object({
          source: z.string(),
          target: z.string(),
          label: z.string().optional(),
          type: z
            .enum(["imports", "calls", "extends", "uses"])
            .optional()
            .describe(
              "Type of relationship between source and target nodes (maximum 4 words)"
            ),
        })
      ),
      loading: z.boolean().default(true),
      analysing: z.boolean().default(false),
      queries: z.array(z.string()).max(3).optional(),
    })
    .refine(
      (data) => {
        const nodeIds = data.nodes.map((n) => n.id);
        return nodeIds.length === new Set(nodeIds).size;
      },
      {
        message: "All node IDs must be unique",
      }
    )
    .refine(
      (data) => {
        const nodeIds = new Set(data.nodes.map((n) => n.id));
        return data.edges.every(
          (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
        );
      },
      {
        message:
          "All edge source and target values must reference existing node IDs",
      }
    ),
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
