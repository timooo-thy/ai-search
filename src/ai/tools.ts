import { dataPartSchema, MyDataPart } from "@/types/ui-message-type";
import { generateObject, tool, UIMessage, UIMessageStreamWriter } from "ai";
import z from "zod";
import {
  getUserRepos,
  searchUserRepoWithContent,
} from "@/actions/github-actions";
import { openai } from "@ai-sdk/openai";
import {
  codeGraphSystemPrompt,
  codeGraphUserPrompt,
  getRepositoriesToolPrompt,
  getWeatherToolPrompt,
  visualiseCodeGraphPrompt,
} from "./prompts";
import * as Sentry from "@sentry/nextjs";

export const getWeatherInformation = (
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>
) =>
  tool({
    description: getWeatherToolPrompt,
    inputSchema: z.object({ city: z.string() }),
    execute: async ({ city }, { toolCallId: id }) => {
      writer.write({
        type: "data-weather",
        data: { location: city, weather: undefined, loading: true },
        id,
      });
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_KEY}&units=metric`
        );

        if (!response.ok) {
          throw new Error(
            `OpenWeather error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.main) {
          writer.write({
            type: "data-weather",
            data: {
              location: city,
              temperature: undefined,
              weather: "Unknown",
              loading: false,
            },
            id,
          });
          return { data: null, city };
        }

        const weather = data.weather[0].main.charAt(0).toUpperCase();
        data.weather[0].main.slice(1);

        writer.write({
          type: "data-weather",
          data: {
            location: city,
            weather,
            temperature: Math.round(data.main.temp),
            loading: false,
          },
          id,
        });

        return { data, city };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "weather_fetch_failed" },
        });
        writer.write({
          type: "data-weather",
          data: {
            location: city,
            temperature: undefined,
            weather: "Unknown",
            loading: false,
          },
          id,
        });
        return { data: null, city, error: "weather_fetch_failed" };
      }
    },
  });

export const getRepositories = (
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>
) =>
  tool({
    description: getRepositoriesToolPrompt,
    inputSchema: z.object({}),
    execute: async (_input, { toolCallId: id }) => {
      writer.write({
        type: "data-repositories",
        data: { details: [], loading: true },
        id,
      });

      try {
        const data = await getUserRepos();

        const details = data.map((repo) => ({
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
        }));

        writer.write({
          type: "data-repositories",
          data: { loading: false, details },
          id,
        });

        return { data: details };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "github_fetch_repos" },
        });
        writer.write({
          type: "data-repositories",
          data: { details: [], loading: false },
          id,
        });
        return { error: "github_fetch_failed" };
      }
    },
  });

export const visualiseCodeGraph = (
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>
) =>
  tool({
    description: visualiseCodeGraphPrompt,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Specific code element or feature to search for in the repository"
        ),
      repo: z.string().describe("Repository name in 'owner/repo' format"),
    }),
    execute: async ({ query, repo }, { toolCallId: id }) => {
      writer.write({
        type: "data-codeGraph",
        data: { nodes: [], edges: [], loading: true },
        id,
      });

      Sentry.logger.info("Visualising code graph for query:", {
        query,
        repo,
      });

      try {
        const data = await searchUserRepoWithContent(query, repo);

        if (!data.length) {
          writer.write({
            type: "data-codeGraph",
            data: { nodes: [], edges: [], loading: false },
            id,
          });
          return { error: "no_results" };
        }

        const result = await generateObject({
          model: openai("gpt-4o-mini"),
          maxOutputTokens: 32768,
          system: codeGraphSystemPrompt,
          schema: dataPartSchema.shape.codeGraph,
          prompt: codeGraphUserPrompt(data, query, repo),
        });

        const { nodes, edges } = result.object;

        writer.write({
          type: "data-codeGraph",
          data: { nodes, edges, loading: false },
          id,
        });

        return { data: { nodes, edges } };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "code_graph_generation_failed" },
        });
        writer.write({
          type: "data-codeGraph",
          data: { nodes: [], edges: [], loading: false },
          id,
        });
        return { error: "code_graph_generation_failed" };
      }
    },
  });

export const tools = (writer: UIMessageStreamWriter) => ({
  getWeatherInformation: getWeatherInformation(writer),
  getRepositories: getRepositories(writer),
  visualiseCodeGraph: visualiseCodeGraph(writer),
});
