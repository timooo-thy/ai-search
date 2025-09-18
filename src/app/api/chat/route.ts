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
  const { message, id }: { message: MyUIMessage; id: string } =
    await req.json();
  const previousMessages = await loadChat(id);
  const validatedMessages: MyUIMessage[] = await validateUIMessages({
    messages: [...previousMessages, message],
    metadataSchema: metadataSchema,
  });

  const result = streamText({
    model: perplexity("sonar-pro"),
    messages: convertToModelMessages(validatedMessages),
  });

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
}
