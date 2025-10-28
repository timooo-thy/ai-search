import { MyDBUIMessagePart, MyUIMessagePart } from "@/types/ui-message-type";
import { MessagePartType, Prisma, Weather } from "../../generated/prisma";
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
      tool_toolCallId: null,
      tool_state: null,
      tool_errorText: null,
      tool_getWeatherInformation_input: null,
      tool_getWeatherInformation_output: null,
      tool_getRepositories_input: null,
      tool_getRepositories_output: null,
      tool_visualiseCodeGraph_input: null,
      tool_visualiseCodeGraph_output: null,
      data_weather_id: null,
      data_weather_location: null,
      data_weather_weather: null,
      data_weather_temperature: null,
      data_repositories_id: null,
      data_repositories_details: null,
      data_codeGraph_id: null,
      data_codeGraph: null,
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
      case "tool-getWeatherInformation":
        return {
          ...basePart,
          order: index,
          type: MessagePartType.tool_getWeatherInformation,
          tool_toolCallId: part.toolCallId,
          tool_state: part.state,
          tool_getWeatherInformation_input:
            part.state === "input-available" ||
            part.state === "output-available" ||
            part.state === "output-error"
              ? (part.input as Prisma.JsonValue)
              : null,
          tool_getWeatherInformation_output:
            part.state === "output-available"
              ? (part.output as Prisma.JsonValue)
              : null,
          tool_errorText: part.state === "output-error" ? part.errorText : null,
        };
      case "tool-getRepositories":
        return {
          ...basePart,
          order: index,
          type: MessagePartType.tool_getRepositories,
          tool_toolCallId: part.toolCallId,
          tool_state: part.state,
          tool_getRepositories_input:
            part.state === "input-available" ||
            part.state === "output-available" ||
            part.state === "output-error"
              ? (part.input as Prisma.JsonValue)
              : null,
          tool_getRepositories_output:
            part.state === "output-available"
              ? (part.output as Prisma.JsonValue)
              : null,
          tool_errorText: part.state === "output-error" ? part.errorText : null,
        };
      case "tool-visualiseCodeGraph":
        return {
          ...basePart,
          order: index,
          type: MessagePartType.tool_visualiseCodeGraph,
          tool_toolCallId: part.toolCallId,
          tool_state: part.state,
          tool_visualiseCodeGraph_input:
            part.state === "input-available" ||
            part.state === "output-available" ||
            part.state === "output-error"
              ? (part.input as Prisma.JsonValue)
              : null,
          tool_visualiseCodeGraph_output:
            part.state === "output-available"
              ? (part.output as Prisma.JsonValue)
              : null,
          tool_errorText: part.state === "output-error" ? part.errorText : null,
        };
      case "data-weather":
        return {
          ...basePart,
          order: index,
          type: MessagePartType.data_weather,
          data_weather_id: part.id ?? null,
          data_weather_location: part.data.location ?? null,
          data_weather_weather: (part.data.weather as Weather) ?? null,
          data_weather_temperature: part.data.temperature ?? null,
        };
      case "data-repositories":
        return {
          ...basePart,
          order: index,
          type: MessagePartType.data_repositories,
          data_repositories_id: part.id ?? null,
          data_repositories_details:
            (part.data.details as Prisma.JsonValue) ?? null,
        };
      case "data-codeGraph":
        return {
          ...basePart,
          order: index,
          type: MessagePartType.data_codeGraph,
          data_codeGraph_id: part.id ?? null,
          data_codeGraph: (part.data as Prisma.JsonValue) ?? null,
        };
      default:
        throw new Error(`Unsupported part type: ${part.type}`);
    }
  });
};

export const mapDBPartToUIMessagePart = (
  part: MyDBUIMessagePart
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
    case "tool_getWeatherInformation":
      if (!part.tool_state) {
        throw new Error("getWeatherInformation_state is undefined");
      }
      switch (part.tool_state) {
        case "input-streaming":
          return {
            type: "tool-getWeatherInformation",
            state: "input-streaming",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_getWeatherInformation_input as Partial<{
                city: string;
              }>) || undefined,
          };
        case "input-available":
          return {
            type: "tool-getWeatherInformation",
            state: "input-available",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_getWeatherInformation_input as { city: string }) ||
              undefined,
          };
        case "output-available":
          return {
            type: "tool-getWeatherInformation",
            state: "output-available",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_getWeatherInformation_input as { city: string }) ||
              undefined,
            output:
              (part.tool_getWeatherInformation_output as {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: any;
                city: string;
              }) || undefined,
          };
        case "output-error":
          return {
            type: "tool-getWeatherInformation",
            state: "output-error",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_getWeatherInformation_input as { city: string }) ||
              undefined,
            errorText: part.tool_errorText!,
          };
        default:
          throw new Error(
            `Unsupported getWeatherInformation state: ${part.tool_state}`
          );
      }
    case "tool_getRepositories":
      if (!part.tool_state) {
        throw new Error("getRepositories_state is undefined");
      }
      switch (part.tool_state) {
        case "input-streaming":
          return {
            type: "tool-getRepositories",
            state: "input-streaming",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_getRepositories_input as Partial<
                Record<string, never>
              >) || undefined,
          };
        case "input-available":
          return {
            type: "tool-getRepositories",
            state: "input-available",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_getRepositories_input as Record<string, never>) ||
              undefined,
          };
        case "output-available":
          return {
            type: "tool-getRepositories",
            state: "output-available",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_getRepositories_input as Record<string, never>) ||
              undefined,
            output:
              (part.tool_getRepositories_output as {
                data: {
                  name: string;
                  description: string | null;
                  url: string;
                }[];
              }) || undefined,
          };
        case "output-error":
          return {
            type: "tool-getRepositories",
            state: "output-error",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_getRepositories_input as Record<string, never>) ||
              undefined,
            errorText: part.tool_errorText!,
          };
        default:
          throw new Error(
            `Unsupported getRepositories state: ${part.tool_state}`
          );
      }
    case "tool_visualiseCodeGraph":
      if (!part.tool_state) {
        throw new Error("visualiseCodeGraph_state is undefined");
      }
      switch (part.tool_state) {
        case "input-streaming":
          return {
            type: "tool-visualiseCodeGraph",
            state: "input-streaming",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_visualiseCodeGraph_input as Partial<
                Record<string, never>
              >) || undefined,
          };
        case "input-available":
          return {
            type: "tool-visualiseCodeGraph",
            state: "input-available",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_visualiseCodeGraph_input as {
                query: string;
                repo: string;
              }) || undefined,
          };
        case "output-available":
          return {
            type: "tool-visualiseCodeGraph",
            state: "output-available",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_visualiseCodeGraph_input as {
                query: string;
                repo: string;
              }) || undefined,
            output:
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (part.tool_visualiseCodeGraph_output as any) || undefined,
          };
        case "output-error":
          return {
            type: "tool-visualiseCodeGraph",
            state: "output-error",
            toolCallId: part.tool_toolCallId!,
            input:
              (part.tool_visualiseCodeGraph_input as {
                query: string;
                repo: string;
              }) || undefined,
            errorText: part.tool_errorText!,
          };
        default:
          throw new Error(
            `Unsupported visualiseCodeGraph state: ${part.tool_state}`
          );
      }
    case "data_weather":
      return {
        type: "data-weather",
        data: {
          loading: false,
          location: part.data_weather_location!,
          weather: (part.data_weather_weather as Weather) || null,
          temperature: part.data_weather_temperature ?? undefined,
        },
        id: part.data_weather_id ?? undefined,
      };
    case "data_repositories":
      return {
        type: "data-repositories",
        data: {
          details:
            (part.data_repositories_details as
              | {
                  name: string;
                  description: string | null;
                  url: string;
                }[]
              | null) || [],
          loading: false,
        },
        id: part.data_repositories_id ?? undefined,
      };
    case "data_codeGraph": {
      const codeGraphData = part.data_codeGraph as {
        nodes?: {
          id: string;
          label: string;
          type?: "file" | "function" | "class" | "component";
          filePath?: string;
          codeSnippet?: string;
          description?: string;
        }[];
        edges?: {
          source: string;
          target: string;
          label?: string;
          type?: "imports" | "calls" | "extends" | "uses";
        }[];
        loading?: boolean;
        queries?: string[];
        analysing?: boolean;
        sources?: {
          path: string;
          url: string;
        }[];
      } | null;

      return {
        type: "data-codeGraph",
        data: {
          nodes: codeGraphData?.nodes ?? [],
          edges: codeGraphData?.edges ?? [],
          loading: codeGraphData?.loading ?? false,
          analysing: codeGraphData?.analysing ?? false,
          queries: codeGraphData?.queries ?? [],
          sources: codeGraphData?.sources ?? [],
        },
        id: part.data_codeGraph_id ?? undefined,
      };
    }
    default:
      throw new Error(`Unsupported part type: ${part.type}`);
  }
};

export const jsonOrDbNull = (v: unknown) =>
  v == null ? Prisma.DbNull : (v as Prisma.InputJsonValue);

export function formatTreeStructure(paths: string[]): string {
  const sortedPaths = [...paths].sort();

  const lines: string[] = [];
  const seenDirs = new Set<string>();

  sortedPaths.forEach((path) => {
    const parts = path.split("/");

    // Add directories
    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join("/");
      if (!seenDirs.has(dirPath)) {
        seenDirs.add(dirPath);
        const indent = "  ".repeat(i);
        lines.push(`${indent}- ${parts[i]}/`);
      }
    }

    // Add file
    const indent = "  ".repeat(parts.length - 1);
    lines.push(`${indent}- ${parts[parts.length - 1]}`);
  });

  return lines.join("\n");
}
