import { AgentTodo, MyDataPart } from "@/types/ui-message-type";
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
  planningSystemPrompt,
  planningUserPrompt,
  visualiseCodeGraphPrompt,
} from "./prompts";
import * as Sentry from "@sentry/nextjs";

const codeGraphGenerationSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(["file", "function", "class", "component"]).optional(),
      filePath: z.string().optional(),
      codeSnippet: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
      type: z.enum(["imports", "calls", "extends", "uses"]).optional(),
    })
  ),
});

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

        const weather =
          data.weather[0].main.charAt(0).toUpperCase() +
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
      // Helper function to update todos state
      const updateTodos = (
        todos: AgentTodo[],
        additionalData?: Partial<typeof baseData>
      ) => {
        writer.write({
          type: "data-codeGraph",
          data: {
            ...baseData,
            ...additionalData,
            todos,
          },
          id,
        });
      };

      const baseData = {
        nodes: [] as {
          id: string;
          label: string;
          type?: "file" | "function" | "class" | "component";
          filePath?: string;
          codeSnippet?: string;
          description?: string;
        }[],
        edges: [] as {
          source: string;
          target: string;
          label?: string;
          type?: "imports" | "calls" | "extends" | "uses";
        }[],
        loading: true,
        analysing: false,
        queries: [] as string[],
        sources: [] as { path: string; url: string; content?: string }[],
      };

      // Initialise with planning todo
      const planningTodo: AgentTodo = {
        id: "planning",
        title: "Planning code exploration",
        description:
          "Analysing repository structure and creating search tasks...",
        status: "in-progress",
      };

      updateTodos([planningTodo]);

      Sentry.captureMessage("Visualising code graph for query:", {
        level: "info",
        tags: { context: "code_graph_visualisation" },
        extra: { query, repo },
      });

      try {
        // Step 1: Get repository structure
        const repoStructure = await Sentry.startSpan(
          {
            name: "get_repo_structure",
            op: "github.api",
            attributes: { repo },
          },
          async () => await getRepoStructure(repo)
        );

        if (!repoStructure || repoStructure.length === 0) {
          updateTodos(
            [
              {
                ...planningTodo,
                status: "error",
                result: "Repository is empty or inaccessible",
              },
            ],
            { loading: false }
          );
          return { error: "empty_repository" };
        }

        // Step 2: Generate the plan with todos
        const planResult = await Sentry.startSpan(
          {
            name: "generate_plan",
            op: "ai.inference",
            attributes: {
              model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
              repo,
            },
          },
          async () =>
            await generateObject({
              model: openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1"),
              system: planningSystemPrompt,
              schema: z.object({
                tasks: z.array(
                  z.object({
                    id: z.string(),
                    title: z.string(),
                    description: z.string(),
                    searchQuery: z.string(),
                  })
                ),
              }),
              prompt: planningUserPrompt(
                query,
                JSON.stringify(repoStructure, null, 2)
              ),
            })
        );

        const { tasks } = planResult.object;

        if (!tasks || tasks.length === 0) {
          updateTodos(
            [
              {
                ...planningTodo,
                status: "error",
                result: "Failed to generate search tasks",
              },
            ],
            { loading: false }
          );
          return { error: "no_tasks_generated" };
        }

        // Mark planning as complete and create task todos
        const completedPlanningTodo: AgentTodo = {
          ...planningTodo,
          status: "completed",
          result: `Created ${tasks.length} search tasks`,
        };

        const taskTodos: AgentTodo[] = tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: "pending" as const,
        }));

        const analyseTodo: AgentTodo = {
          id: "analyse",
          title: "Generating code graph",
          description:
            "Analysing search results and building the code relationship graph...",
          status: "pending",
        };

        updateTodos([completedPlanningTodo, ...taskTodos, analyseTodo], {
          queries: tasks.map((t) => t.searchQuery),
        });

        Sentry.logger.info(
          `Generated ${tasks.length} search tasks for query: ${query}`
        );

        // Step 3: Execute each search task sequentially
        const allSearchResults: {
          name: string;
          path: string;
          url: string;
          content: string;
        }[] = [];
        const allSources: { path: string; url: string; content?: string }[] =
          [];
        const seenSources = new Map<
          string,
          { path: string; url: string; content?: string }
        >();
        const resultsPerTask: number[] = new Array(tasks.length).fill(0);

        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];

          // Update current task to in-progress
          const currentTodos = [
            completedPlanningTodo,
            ...taskTodos.map((t, idx) => ({
              ...t,
              status:
                idx < i
                  ? ("completed" as const)
                  : idx === i
                  ? ("in-progress" as const)
                  : ("pending" as const),
              result:
                idx < i ? `Found ${resultsPerTask[idx]} results` : undefined,
            })),
            analyseTodo,
          ];
          updateTodos(currentTodos);

          // Execute the search
          const searchResults = await Sentry.startSpan(
            {
              name: `search_task_${i + 1}`,
              op: "github.search",
              attributes: { repo, query: task.searchQuery, taskId: task.id },
            },
            async () => await searchUserRepoWithContent(task.searchQuery, repo)
          );

          resultsPerTask[i] = searchResults.length;

          // Add results
          allSearchResults.push(...searchResults);
          searchResults.forEach((item) => {
            const key = `${item.path}::${item.url}`;
            if (!seenSources.has(key)) {
              seenSources.set(key, {
                path: item.path,
                url: item.url,
                content: item.content,
              });
            }
          });

          // Update sources
          allSources.length = 0;
          allSources.push(...Array.from(seenSources.values()));
        }

        const completedTaskTodos: AgentTodo[] = tasks.map((task, idx) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: "completed" as const,
          result: `Found ${resultsPerTask[idx]} code matches`,
        }));

        if (allSearchResults.length === 0) {
          const noResultsTodos = [
            completedPlanningTodo,
            ...completedTaskTodos.map((t) => ({
              ...t,
              result: "No results found",
            })),
            {
              ...analyseTodo,
              status: "error" as const,
              result: "No code to analyse",
            },
          ];
          updateTodos(noResultsTodos, { loading: false, sources: allSources });
          return { error: "no_results" };
        }

        // Step 4: Start analysis phase
        const analysingTodos = [
          completedPlanningTodo,
          ...completedTaskTodos,
          { ...analyseTodo, status: "in-progress" as const },
        ];
        updateTodos(analysingTodos, { analysing: true, sources: allSources });

        // Generate the code graph
        const result = await Sentry.startSpan(
          {
            name: "generate_code_graph",
            op: "ai.inference",
            attributes: {
              model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
              resultCount: allSearchResults.length,
            },
          },
          async () =>
            await generateObject({
              model: openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1"),
              maxOutputTokens: 32768,
              system: codeGraphSystemPrompt,
              schema: codeGraphGenerationSchema,
              prompt: codeGraphUserPrompt(allSearchResults, query, repo),
            })
        );

        const { nodes, edges } = result.object;

        // Validate and filter edges to only include those with valid node references
        const nodeIds = new Set(nodes.map((n) => n.id));
        const validEdges = edges.filter(
          (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
        );

        Sentry.logger.info(
          `Generated ${nodes.length} nodes and ${
            validEdges.length
          } valid edges (${
            edges.length - validEdges.length
          } invalid edges filtered)`
        );

        // Final state - all complete
        const finalTodos = [
          completedPlanningTodo,
          ...completedTaskTodos,
          {
            ...analyseTodo,
            status: "completed" as const,
            result: `Generated graph with ${nodes.length} nodes and ${validEdges.length} relationships`,
          },
        ];

        writer.write({
          type: "data-codeGraph",
          data: {
            todos: finalTodos,
            nodes,
            edges: validEdges,
            loading: false,
            analysing: false,
            queries: tasks.map((t) => t.searchQuery),
            sources: allSources,
          },
          id,
        });

        return { data: { nodes, edges } };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "code_graph_generation_failed" },
          extra: { query, repo },
        });

        const errorTodo: AgentTodo = {
          id: "error",
          title: "Code graph generation failed",
          description: "Failed to complete code graph generation",
          status: "error",
          result: error instanceof Error ? error.message : "Unknown error",
        };

        updateTodos([errorTodo], { loading: false, analysing: false });
        return { error: "code_graph_generation_failed" };
      }
    },
  });

export const tools = (writer: UIMessageStreamWriter) => ({
  getWeatherInformation: getWeatherInformation(writer),
  getRepositories: getRepositories(writer),
  visualiseCodeGraph: visualiseCodeGraph(writer),
});
