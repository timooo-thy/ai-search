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
export async function POST(req: Request) {
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
          model: openai("gpt-4o-mini"),
          messages: convertToModelMessages(validatedMessages),
          stopWhen: stepCountIs(5),
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
          await upsertMessages(
            [...validatedMessages.slice(-1), responseMessage],
            id
          );
        } catch (error) {
          console.error("Error saving messages:", error);
        }
      },
    });
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return new Response("Chat not found.", { status: 404 });
  }
}
