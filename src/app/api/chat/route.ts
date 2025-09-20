import { loadChat, saveNewMessages } from "@/actions/ui-message-actions";
import { auth } from "@/lib/auth";
import { metadataSchema, MyUIMessage } from "@/types/ui-message-type";
import { perplexity } from "@ai-sdk/perplexity";
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  validateUIMessages,
} from "ai";
import { headers } from "next/headers";

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
      onFinish: ({ responseMessage }) => {
        console.log("Saving new messages...");
        try {
          saveNewMessages(
            [...validatedMessages.slice(-1), responseMessage],
            id
          );
        } catch (error) {
          console.error("Error saving messages:", error);
        }
      },
    });
  } catch (error) {
    return new Response("Chat not found.", { status: 404 });
  }
}
