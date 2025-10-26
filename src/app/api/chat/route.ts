import { loadChat, upsertMessages } from "@/actions/ui-message-actions";
import { auth } from "@/lib/auth";
import { metadataSchema, MyUIMessage } from "@/types/ui-message-type";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  validateUIMessages,
  stepCountIs,
  createUIMessageStream,
  generateId,
  createUIMessageStreamResponse,
} from "ai";
import { headers } from "next/headers";
import { tools } from "@/ai/tools";
import { chatSystemPrompt } from "@/ai/prompts";
import * as Sentry from "@sentry/nextjs";

/**
 * Handle POST requests to stream AI-assisted chat responses, validate and persist UI messages, and return a streaming UI response.
 *
 * Validates the incoming message against existing chat state, runs an OpenAI streaming generation (with repository search tooling), merges the generated stream into the UI message stream, and persists the final messages. Returns 401 if the request is unauthenticated and returns a 404 response on unexpected errors.
 *
 * @param req - The incoming Request whose JSON body must contain `{ message: MyUIMessage, id: string }`.
 * @returns A Response carrying a streaming UI message payload with the assistant's streamed reply and intermediate stream events.
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  const { message, id }: { message: MyUIMessage; id: string } =
    await req.json();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const previousMessages = await loadChat(id);

    let messagesToValidate: MyUIMessage[];

    const existingMessageIndex = previousMessages.findIndex(
      (msg) => msg.id === message.id
    );

    if (existingMessageIndex !== -1) {
      messagesToValidate = [...previousMessages];

      const existingMessage = messagesToValidate[existingMessageIndex];
      const updatedMessage: MyUIMessage = {
        ...message,
        metadata: message.metadata ||
          existingMessage.metadata || {
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
      };
      messagesToValidate[existingMessageIndex] = updatedMessage;
    } else {
      messagesToValidate = [...previousMessages, message];
    }

    const validatedMessages: MyUIMessage[] = await validateUIMessages({
      messages: messagesToValidate,
      metadataSchema: metadataSchema,
    });

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        if (message.role === "user") {
          writer.write({
            type: "start",
            messageId: generateId(),
          });
          writer.write({
            type: "start-step",
          });
        }

        const result = streamText({
          model: openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1"),
          system: chatSystemPrompt,
          messages: convertToModelMessages(validatedMessages),
          stopWhen: stepCountIs(2),
          tools: tools(writer),
        });

        result.consumeStream();

        writer.merge(
          result.toUIMessageStream({
            sendStart: false,
            generateMessageId: createIdGenerator({
              prefix: "msg",
              size: 16,
            }),
            messageMetadata: ({ part }) => {
              if (part.type === "start") {
                return {
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                };
              }
            },
          })
        );
      },
      onError: (error) => {
        return error instanceof Error ? error.message : String(error);
      },
      originalMessages: validatedMessages,
      onFinish: async ({ responseMessage }) => {
        try {
          const endTime = Date.now();
          const duration = endTime - startTime;

          Sentry.captureMessage("Chat request completed", {
            level: "info",
            tags: {
              context: "chat_completion",
              messageRole: message.role,
            },
            extra: {
              chatId: id,
              duration_ms: duration,
              duration_seconds: (duration / 1000).toFixed(2),
              hasResponse: !!responseMessage,
            },
          });

          await upsertMessages(
            [...validatedMessages.slice(-1), responseMessage],
            id
          );
        } catch (error) {
          Sentry.captureException(error, {
            tags: { context: "save_messages" },
          });
        }
      },
    });
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    Sentry.captureException(error, {
      tags: { context: "chat_post" },
      extra: {
        duration_ms: duration,
        duration_seconds: (duration / 1000).toFixed(2),
      },
    });

    return new Response("An error occurred processing your request.", {
      status: 500,
    });
  }
}
