import { loadChat, saveNewMessages } from "@/actions/ui-message-actions";
import { metadataSchema, MyUIMessage } from "@/types/ui-message-type";
import { perplexity } from "@ai-sdk/perplexity";
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  validateUIMessages,
} from "ai";

export async function POST(req: Request) {
  const {
    message,
    id,
    userId,
  }: { message: MyUIMessage; id: string; userId: string } = await req.json();
  try {
    const previousMessages = await loadChat(id, userId);

    const validatedMessages: MyUIMessage[] = await validateUIMessages({
      messages: [...previousMessages, message],
      metadataSchema: metadataSchema,
    });

    const result = streamText({
      model: perplexity("sonar-pro"),
      messages: convertToModelMessages(validatedMessages),
    });

    result.consumeStream();

    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
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
      onFinish: ({ messages }) => {
        saveNewMessages(messages, id);
      },
    });
  } catch (error) {
    return new Response("Chat not found or access denied.", { status: 404 });
  }
}
