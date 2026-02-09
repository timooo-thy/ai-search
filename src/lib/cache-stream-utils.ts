import { UIMessageStreamWriter } from "ai";
import { MyUIMessage } from "@/types/ui-message-type";
import { generateId } from "ai";
import * as Sentry from "@sentry/nextjs";

/**
 * Stream a text part with artificial delay to simulate real-time streaming
 */
async function streamTextPart(
  writer: UIMessageStreamWriter,
  text: string,
  partId: string,
  chunkSize: number = 30,
  delayMs: number = 40,
) {
  writer.write({
    type: "text-start",
    id: partId,
  });

  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    writer.write({
      type: "text-delta",
      id: partId,
      delta: chunk,
    });
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  writer.write({
    type: "text-end",
    id: partId,
  });
}

/**
 * Stream a tool call with its input arguments
 */
// async function streamToolCall(
//   writer: UIMessageStreamWriter,
//   toolCallId: string,
//   toolName: string,
//   input: unknown,
//   chunkSize: number = 50,
//   delayMs: number = 20
// ) {
//   writer.write({
//     type: "tool-input-start",
//     toolCallId,
//     toolName,
//   });

//   if (input) {
//     const argsString = JSON.stringify(input);
//     for (let i = 0; i < argsString.length; i += chunkSize) {
//       const chunk = argsString.slice(i, i + chunkSize);
//       writer.write({
//         type: "tool-input-delta",
//         inputTextDelta: chunk,
//         toolCallId,
//       });
//       await new Promise((resolve) => setTimeout(resolve, delayMs));
//     }
//   }

//   writer.write({
//     type: "tool-input-available",
//     toolCallId,
//     toolName,
//     input,
//   });
// }

/**
 * Write a tool result
 */
// function writeToolResult(
//   writer: UIMessageStreamWriter,
//   toolCallId: string,
//   result: unknown
// ) {
//   writer.write({
//     type: "tool-output-available",
//     toolCallId,
//     output: result,
//   });
// }

/**
 * Stream a single message part based on its type
 */
async function streamMessagePart(
  writer: UIMessageStreamWriter,
  part: MyUIMessage["parts"][number],
) {
  const { logger } = Sentry;
  const partId = generateId();

  switch (part.type) {
    case "text":
      await streamTextPart(writer, part.text, partId);
      break;

    case "data-codeGraph":
      writer.write({
        type: "data-codeGraph",
        data: part.data,
        id: partId,
      });
      break;

    case "data-weather":
      writer.write({
        type: "data-weather",
        data: part.data,
        id: partId,
      });
      break;

    case "data-repositories":
      writer.write({
        type: "data-repositories",
        data: part.data,
        id: partId,
      });
      break;

    // case "tool-getRepositories":
    //   await streamToolCall(
    //     writer,
    //     part.toolCallId,
    //     "getRepositories",
    //     part.input
    //   );
    //   writeToolResult(writer, part.toolCallId, part.output);
    //   break;

    // case "tool-getWeatherInformation":
    //   await streamToolCall(
    //     writer,
    //     part.toolCallId,
    //     "getWeatherInformation",
    //     part.input
    //   );
    //   writeToolResult(writer, part.toolCallId, part.output);
    //   break;

    // case "tool-visualiseCodeGraph":
    //   await streamToolCall(
    //     writer,
    //     part.toolCallId,
    //     "tool_visualiseCodeGraph",
    //     part.input
    //   );
    //   writeToolResult(writer, part.toolCallId, part.output);
    //   break;

    default:
      logger.warn(
        logger.fmt`Unknown part type in cached message: ${part.type}`,
      );
  }
}

/**
 * Stream an entire cached message with all its parts
 */
export async function streamCachedMessage(
  writer: UIMessageStreamWriter,
  cachedMessage: MyUIMessage,
) {
  const { logger } = Sentry;
  return Sentry.startSpan(
    {
      op: "cache.stream",
      name: "Stream Cached Message Parts",
      attributes: {
        parts_count: cachedMessage.parts.length,
      },
    },
    async () => {
      const messageId = generateId();
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Start message
      writer.write({
        type: "start",
        messageId,
        messageMetadata: {
          time: currentTime,
        },
      });

      // Start step
      writer.write({
        type: "start-step",
      });

      // Stream all parts
      for (const part of cachedMessage.parts) {
        await streamMessagePart(writer, part);
      }

      // Finish step
      writer.write({
        type: "finish-step",
      });

      // Finish message
      writer.write({
        type: "finish",
      });

      logger.debug(
        logger.fmt`Streamed ${cachedMessage.parts.length} cached message parts`,
      );
    },
  );
}
