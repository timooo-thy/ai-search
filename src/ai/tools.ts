import { dataPartSchema, MyDataPart } from "@/types/ui-message-type";
import { generateObject, tool, UIMessage, UIMessageStreamWriter } from "ai";
import z from "zod";
import {
  getRepoStructure,
  getUserRepos,
  searchUserRepoWithContent,
} from "@/actions/github-actions";
import { openai } from "@ai-sdk/openai";
import {
  codeGraphSystemPrompt,
  codeGraphUserPrompt,
  getRepositoriesToolPrompt,
  getWeatherToolPrompt,
  queryCodeGraphSystemPrompt,
  queryCodeGraphUserPrompt,
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
      query: z.string().describe("User's query"),
      repo: z.string().describe("Repository name in 'owner/repo' format"),
    }),
    execute: async ({ query, repo }, { toolCallId: id }) => {
      writer.write({
        type: "data-codeGraph",
        data: {
          nodes: [],
          edges: [],
          loading: true,
          analysing: false,
          queries: [],
        },
        id,
      });

      Sentry.captureMessage("Visualising code graph for query:", {
        level: "info",
        tags: { context: "code_graph_visualisation" },
        extra: {
          query,
          repo,
        },
      });

      try {
        const repoStructure = await Sentry.startSpan(
          {
            name: "get_repo_structure",
            op: "github.api",
            attributes: { repo },
          },
          async () => await getRepoStructure(repo)
        );

        if (!repoStructure || repoStructure.length === 0) {
          writer.write({
            type: "data-codeGraph",
            data: {
              nodes: [],
              edges: [],
              loading: false,
              analysing: false,
              queries: [],
            },
            id,
          });
          return { error: "empty_repository" };
        }

        const queries = await Sentry.startSpan(
          {
            name: "generate_search_queries",
            op: "ai.inference",
            attributes: { model: "gpt-4.1", repo },
          },
          async () =>
            await generateObject({
              model: openai("gpt-4.1"),
              system: queryCodeGraphSystemPrompt,
              schema: z.object({
                query_1: z.string(),
                query_2: z.string(),
                query_3: z.string(),
              }),
              prompt: queryCodeGraphUserPrompt(
                query,
                JSON.stringify(repoStructure, null, 2)
              ),
            })
        );

        const { query_1, query_2, query_3 } = queries.object;

        if (!query_1 && !query_2 && !query_3) {
          writer.write({
            type: "data-codeGraph",
            data: {
              nodes: [],
              edges: [],
              loading: false,
              queries: [],
              analysing: false,
            },
            id,
          });
          return { error: "no_queries_generated" };
        } else {
          writer.write({
            type: "data-codeGraph",
            data: {
              nodes: [],
              edges: [],
              loading: true,
              queries: [query_1, query_2, query_3],
              analysing: false,
            },
            id,
          });
        }
        Sentry.logger.info(
          `Generated queries: ${query_1}, ${query_2}, ${query_3}`
        );
        Sentry.logger.info(`Searching repository: ${repo}`);

        const [data1, data2, data3] = await Sentry.startSpan(
          {
            name: "search_repository",
            op: "github.search",
            attributes: { repo, queries: 3 },
          },
          async () =>
            await Promise.all([
              searchUserRepoWithContent(query_1, repo),
              searchUserRepoWithContent(query_2, repo),
              searchUserRepoWithContent(query_3, repo),
            ])
        );

        const data = [...data1, ...data2, ...data3];

        if (!data.length) {
          writer.write({
            type: "data-codeGraph",
            data: {
              nodes: [],
              edges: [],
              loading: false,
              analysing: false,
              queries: [query_1, query_2, query_3],
            },
            id,
          });
          return { error: "no_results" };
        } else {
          writer.write({
            type: "data-codeGraph",
            data: {
              nodes: [],
              edges: [],
              loading: true,
              analysing: true,
              queries: [query_1, query_2, query_3],
            },
            id,
          });
        }

        const result = await generateObject({
          model: openai("gpt-4.1"),
          maxOutputTokens: 32768,
          system: codeGraphSystemPrompt,
          schema: dataPartSchema.shape.codeGraph,
          prompt: codeGraphUserPrompt(data, query, repo),
        });

        const { nodes, edges } = result.object;

        writer.write({
          type: "data-codeGraph",
          data: {
            nodes,
            edges,
            loading: false,
            analysing: false,
            queries: [query_1, query_2, query_3],
          },
          id,
        });

        return { data: { nodes, edges } };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "code_graph_generation_failed" },
        });
        writer.write({
          type: "data-codeGraph",
          data: {
            nodes: [],
            edges: [],
            loading: false,
            analysing: false,
            queries: [],
          },
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
