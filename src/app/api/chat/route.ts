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
import { streamCachedMessage } from "@/lib/cache-stream-utils";
import { redis } from "@/lib/redis";

/**
 * Handles POST requests for AI chat responses with caching and streaming.
 *
 * This endpoint authenticates the user, checks Redis cache for previous responses,
 * and either streams a cached response or generates a new one using OpenAI with tool support.
 * All responses are streamed as UI messages and persisted to the database.
 *
 * @param req - Request with JSON body `{ message: MyUIMessage, id: string }`
 * @returns Streaming response with UI messages, or 401/500 on auth/error
 */

export async function POST(req: Request) {
  const { logger } = Sentry;
  const startTime = Date.now();

  const { message, id }: { message: MyUIMessage; id: string } =
    await req.json();

  // Authenticate the user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorised", { status: 401 });
  }

  try {
    // Create a unique cache key based on user ID, chat ID, and message content.
    const messageKey = message.parts.map((part) =>
      part.type === "text" ? part.text.toLowerCase().trim() : ""
    );
    const key = `user:${session.user.id}_chat:${id}_message:${messageKey.join(
      ":"
    )}`;

    // Check the cache for a previously cached message
    let cachedMessageJson = null;

    try {
      cachedMessageJson = await redis.get(key);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: "redis_get_failure" },
      });
    }

    if (cachedMessageJson != null) {
      const cachedResponse = Sentry.startSpan(
        {
          op: "cache.hit",
          name: "Stream Cached Chat Response",
          attributes: {
            cache_key: key,
            user_id: session.user.id,
          },
        },
        () => {
          logger.debug(logger.fmt`Cache hit for user ${session.user.id}`);

          const cachedMessage = JSON.parse(cachedMessageJson) as MyUIMessage;

          // Stream the cached message
          const stream = createUIMessageStream({
            originalMessages: [],
            execute: async ({ writer }) => {
              await streamCachedMessage(writer, cachedMessage);
            },
            onError: (error) => {
              Sentry.captureException(error, {
                tags: { context: "cache_stream_error" },
                extra: { cache_key: key },
              });
              return error instanceof Error ? error.message : String(error);
            },
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

                await Sentry.startSpan(
                  {
                    op: "db.upsert",
                    name: "Save Chat Messages",
                    attributes: { chat_id: id, message_count: 2 },
                  },
                  () => upsertMessages([message, responseMessage], id)
                );
              } catch (error) {
                Sentry.captureException(error, {
                  tags: { context: "save_messages" },
                });
              }
            },
          });

          return createUIMessageStreamResponse({ stream });
        }
      );

      return cachedResponse;
    }

    // Load previous messages in the chat
    const previousMessages = await Sentry.startSpan(
      {
        op: "db.query",
        name: "Load Chat Messages",
        attributes: { chat_id: id },
      },
      () => loadChat(id)
    );

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
              hour12: true,
            }),
          },
      };
      messagesToValidate[existingMessageIndex] = updatedMessage;
    } else {
      messagesToValidate = [...previousMessages, message];
    }

    // Validate messages
    const validatedMessages: MyUIMessage[] = await validateUIMessages({
      messages: messagesToValidate,
      metadataSchema: metadataSchema,
    });

    // Stream a new AI-generated response
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        if (message.role === "user") {
          writer.write({
            type: "start",
            messageId: generateId(),
            messageMetadata: {
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
            },
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
                    hour12: true,
                  }),
                };
              }
            },
          })
        );
      },
      onError: (error) => {
        Sentry.captureException(error, {
          tags: { context: "stream_error" },
        });
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

          await Sentry.startSpan(
            {
              op: "db.upsert",
              name: "Save Chat Messages",
              attributes: { chat_id: id, message_count: 2 },
            },
            () =>
              upsertMessages(
                [...validatedMessages.slice(-1), responseMessage],
                id
              )
          );

          try {
            await redis.set(key, JSON.stringify(responseMessage), {
              EX: 60 * 60 * 24,
            });
          } catch (error) {
            Sentry.captureException(error, {
              tags: { context: "redis_cache_write" },
            });
          }
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
