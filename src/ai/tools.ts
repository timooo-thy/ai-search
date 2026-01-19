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
  analyseGapsSystemPrompt,
  analyseGapsUserPrompt,
} from "./prompts";
import * as Sentry from "@sentry/nextjs";
import { searchCodeChunks, CodeChunkMetadata } from "@/lib/vector";
import { getIndexingStatus } from "@/services/repo-indexer";

const codeGraphGenerationSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(["file", "function", "class", "component"]).optional(),
      filePath: z.string().optional(),
      codeSnippet: z.string().optional(),
      description: z.string().optional(),
    }),
  ),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
      type: z.enum(["imports", "calls", "extends", "uses"]).optional(),
    }),
  ),
});

export const getWeatherInformation = (
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>,
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
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_KEY}&units=metric`,
        );

        if (!response.ok) {
          throw new Error(
            `OpenWeather error: ${response.status} ${response.statusText}`,
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
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>,
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
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>,
  indexedRepos?: string[],
) => {
  const indexedList =
    indexedRepos && indexedRepos.length > 0
      ? `\n\nNOTE: The following repositories are already indexed and should use the visualiseCodeGraphIndexed tool instead: ${indexedRepos.join(", ")}`
      : "";

  return tool({
    description: `${visualiseCodeGraphPrompt}\n\n⚠️ FALLBACK TOOL - Only use for NON-INDEXED repositories ⚠️\nThis performs live GitHub API searches which is SLOWER than the indexed version.\n\nDO NOT use this tool if the repository is in the indexed list. Check visualiseCodeGraphIndexed first.${indexedList}`,
    inputSchema: z.object({
      query: z.string().describe("User's query"),
      repo: z.string().describe("Repository name in 'owner/repo' format"),
    }),
    execute: async ({ query, repo }, { toolCallId: id }) => {
      const MAX_ITERATIONS = 4; // Maximum number of search cycles

      // Helper function to update todos state
      const updateTodos = (
        todos: AgentTodo[],
        additionalData?: Partial<typeof baseData>,
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
          async () => await getRepoStructure(repo),
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
            { loading: false },
          );
          return { error: "empty_repository" };
        }

        // Step 2: Generate the initial plan with todos
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
                  }),
                ),
              }),
              prompt: planningUserPrompt(
                query,
                JSON.stringify(repoStructure, null, 2),
              ),
            }),
        );

        let { tasks } = planResult.object;

        if (!tasks || tasks.length === 0) {
          updateTodos(
            [
              {
                ...planningTodo,
                status: "error",
                result: "Failed to generate search tasks",
              },
            ],
            { loading: false },
          );
          return { error: "no_tasks_generated" };
        }

        // Track all search results across iterations
        const allSearchResults: {
          name: string;
          path: string;
          url: string;
          content: string;
        }[] = [];
        const seenSources = new Map<
          string,
          { path: string; url: string; content?: string }
        >();
        const allQueries: string[] = [];
        const completedTodos: AgentTodo[] = [];
        let iteration = 1;
        let continueSearch = true;

        // Mark planning as complete
        const completedPlanningTodo: AgentTodo = {
          ...planningTodo,
          status: "completed",
          result: `${tasks.length} tasks`,
        };
        completedTodos.push(completedPlanningTodo);

        // Iterative search loop
        while (continueSearch && iteration <= MAX_ITERATIONS) {
          // Create task todos for current iteration
          const taskTodos: AgentTodo[] = tasks.map((task) => ({
            id: `${task.id}-iter${iteration}`,
            title: task.title,
            description: task.description,
            status: "pending" as const,
          }));

          const analyseTodo: AgentTodo = {
            id: `analyse-iter${iteration}`,
            title: "Checking for missing files",
            description: "Checking if additional searches are needed...",
            status: "pending",
          };

          // Add queries from current tasks
          tasks.forEach((t) => allQueries.push(t.searchQuery));

          updateTodos([...completedTodos, ...taskTodos, analyseTodo], {
            queries: allQueries,
          });

          Sentry.logger.info(
            `Iteration ${iteration}: Executing ${tasks.length} search tasks`,
          );

          // Execute each search task
          const resultsPerTask: number[] = new Array(tasks.length).fill(0);

          for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];

            // Update current task to in-progress
            const currentTodos = [
              ...completedTodos,
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
                name: `search_task_iter${iteration}_${i + 1}`,
                op: "github.search",
                attributes: { repo, query: task.searchQuery, taskId: task.id },
              },
              async () =>
                await searchUserRepoWithContent(task.searchQuery, repo),
            );

            resultsPerTask[i] = searchResults.length;

            // Add results (deduplicated)
            searchResults.forEach((result) => {
              const key = `${result.path}`;
              if (!seenSources.has(key)) {
                allSearchResults.push(result);
                seenSources.set(key, {
                  path: result.path,
                  url: result.url,
                  content: result.content,
                });
              }
            });
          }

          // Mark all tasks as completed for this iteration
          const completedTaskTodos: AgentTodo[] = tasks.map((task, idx) => ({
            id: `${task.id}-iter${iteration}`,
            title: task.title,
            description: task.description,
            status: "completed" as const,
            result: `Found ${resultsPerTask[idx]} matches`,
          }));
          completedTodos.push(...completedTaskTodos);

          // Update sources
          const allSources = Array.from(seenSources.values());

          if (allSearchResults.length === 0) {
            const noResultsTodos = [
              ...completedTodos,
              {
                ...analyseTodo,
                status: "error" as const,
                result: "No code found to analyse",
              },
            ];
            updateTodos(noResultsTodos, {
              loading: false,
              sources: allSources,
            });
            return { error: "no_results" };
          }

          // Check if we should continue searching (unless at max iterations)
          if (iteration >= MAX_ITERATIONS) {
            continueSearch = false;
            completedTodos.push({
              ...analyseTodo,
              status: "completed",
              result: "Search complete",
            });
          } else {
            // Update analyse todo to in-progress
            updateTodos(
              [...completedTodos, { ...analyseTodo, status: "in-progress" }],
              { sources: allSources },
            );

            // Analyse gaps and decide whether to continue
            const gapAnalysis = await Sentry.startSpan(
              {
                name: `analyze_gaps_iter${iteration}`,
                op: "ai.inference",
                attributes: {
                  model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
                  resultCount: allSearchResults.length,
                  iteration,
                },
              },
              async () =>
                await generateObject({
                  model: openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1"),
                  system: analyseGapsSystemPrompt,
                  schema: z.object({
                    continueSearch: z.boolean(),
                    reasoning: z.string(),
                    additionalTasks: z.array(
                      z.object({
                        id: z.string(),
                        title: z.string(),
                        description: z.string(),
                        searchQuery: z.string(),
                      }),
                    ),
                  }),
                  prompt: analyseGapsUserPrompt(
                    query,
                    allSearchResults.map((r) => ({
                      path: r.path,
                      content: r.content,
                    })),
                    iteration,
                    MAX_ITERATIONS,
                  ),
                }),
            );

            const {
              continueSearch: shouldContinue,
              reasoning,
              additionalTasks,
            } = gapAnalysis.object;

            if (shouldContinue && additionalTasks.length > 0) {
              completedTodos.push({
                ...analyseTodo,
                status: "completed",
                result: `Found ${additionalTasks.length} missing pieces`,
              });
              tasks = additionalTasks;
              iteration++;
              Sentry.logger.info(
                `Iteration ${iteration - 1} complete. Continuing with ${
                  additionalTasks.length
                } additional tasks: ${reasoning}`,
              );
            } else {
              continueSearch = false;
              completedTodos.push({
                ...analyseTodo,
                status: "completed",
                result: "All files found",
              });
            }
          }
        }

        // Final step: Generate the code graph
        const allSources = Array.from(seenSources.values());

        const graphTodo: AgentTodo = {
          id: "generate-graph",
          title: "Generating code graph",
          description:
            "Building the code relationship graph from collected files...",
          status: "in-progress",
        };

        updateTodos([...completedTodos, graphTodo], {
          analysing: true,
          sources: allSources,
        });

        // Generate the code graph
        const result = await Sentry.startSpan(
          {
            name: "generate_code_graph",
            op: "ai.inference",
            attributes: {
              model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
              resultCount: allSearchResults.length,
              iterations: iteration,
            },
          },
          async () =>
            await generateObject({
              model: openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1"),
              maxOutputTokens: 32768,
              system: codeGraphSystemPrompt,
              schema: codeGraphGenerationSchema,
              prompt: codeGraphUserPrompt(allSearchResults, query, repo),
            }),
        );

        const { nodes, edges } = result.object;

        // Validate and filter edges to only include those with valid node references
        const nodeIds = new Set(nodes.map((n) => n.id));
        const validEdges = edges.filter(
          (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
        );

        Sentry.logger.info(
          `Generated ${nodes.length} nodes and ${validEdges.length} valid edges after ${iteration} iteration(s)`,
        );

        // Final state - all complete
        const finalTodos = [
          ...completedTodos,
          {
            ...graphTodo,
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
            queries: allQueries,
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
};

/**
 * Vector-based code graph visualisation tool
 * Uses pre-indexed repository data from Upstash Vector for faster, more complete results
 */
export const visualiseCodeGraphIndexed = (
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>,
  userId: string,
  indexedRepos?: string[],
) => {
  const repoList =
    indexedRepos && indexedRepos.length > 0 ? indexedRepos.join(", ") : "none";

  return tool({
    description: `${visualiseCodeGraphPrompt}

⚡ PREFERRED TOOL - USE THIS FOR INDEXED REPOSITORIES ⚡
This tool provides FASTER and MORE COMPLETE results using pre-indexed vector data.

Currently indexed repositories: ${repoList}

IMPORTANT: If the user mentions ANY repository from the indexed list above (e.g., asks about "university-guide", "machine_learning", etc.), you MUST use this tool instead of visualiseCodeGraph.`,
    inputSchema: z.object({
      query: z.string().describe("User's query about the codebase"),
      repo: z.string().describe("Repository name in 'owner/repo' format"),
    }),
    execute: async ({ query, repo }, { toolCallId: id }) => {
      const updateTodos = (
        todos: AgentTodo[],
        additionalData?: Partial<typeof baseData>,
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

      // Check if repo is indexed
      const checkingTodo: AgentTodo = {
        id: "checking",
        title: "Checking repository index",
        description: "Verifying repository is indexed...",
        status: "in-progress",
      };
      updateTodos([checkingTodo]);

      const MAX_ITERATIONS = 3; // Maximum search iterations for indexed search

      try {
        const indexStatus = await getIndexingStatus(repo, userId);

        if (!indexStatus || indexStatus.status !== "COMPLETED") {
          updateTodos(
            [
              {
                ...checkingTodo,
                status: "error",
                result: indexStatus
                  ? `Repository is ${indexStatus.status.toLowerCase()}`
                  : "Repository not indexed. Please index it first.",
              },
            ],
            { loading: false },
          );
          return {
            error: "repo_not_indexed",
            message:
              "This repository has not been indexed. Please index it first using the repository settings.",
          };
        }

        const completedCheckingTodo: AgentTodo = {
          ...checkingTodo,
          status: "completed",
          result: `${indexStatus.indexedFiles} files indexed`,
        };

        // Planning phase - generate search tasks (like non-indexed version)
        const planningTodo: AgentTodo = {
          id: "planning",
          title: "Planning code exploration",
          description: "Creating search tasks for the query...",
          status: "in-progress",
        };
        updateTodos([completedCheckingTodo, planningTodo]);

        Sentry.captureMessage("Agentic vector search for code graph", {
          level: "info",
          tags: { context: "code_graph_vector_search_agentic" },
          extra: { query, repo, userId },
        });

        // Generate initial search tasks
        const planResult = await Sentry.startSpan(
          {
            name: "generate_search_plan_indexed",
            op: "ai.inference",
            attributes: {
              model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
              repo,
            },
          },
          async () =>
            await generateObject({
              model: openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1"),
              system: `You are an expert at generating semantic search queries for code exploration.
Given a user's query about a codebase, create 2-4 targeted search queries that will find the most relevant code.

Each query should target a different aspect:
1. Entry points / main interfaces
2. Core implementation / business logic  
3. Data models / types / schemas
4. Related utilities or helpers

Queries should be natural language descriptions that match how code documentation and comments are written.`,
              schema: z.object({
                tasks: z.array(
                  z.object({
                    id: z.string(),
                    title: z.string(),
                    description: z.string(),
                    searchQuery: z
                      .string()
                      .describe(
                        "Semantic search query - natural language that matches code/docs",
                      ),
                  }),
                ),
              }),
              prompt: `Create search tasks for exploring: "${query}" in repository ${repo}`,
            }),
        );

        let { tasks } = planResult.object;

        if (!tasks || tasks.length === 0) {
          // Fallback to single query
          tasks = [
            {
              id: "main",
              title: "Main search",
              description: `Searching for ${query}`,
              searchQuery: query,
            },
          ];
        }

        const completedPlanningTodo: AgentTodo = {
          ...planningTodo,
          status: "completed",
          result: `${tasks.length} search tasks`,
        };

        // Track all results across iterations
        const allSearchResults: { id: string; metadata: CodeChunkMetadata }[] =
          [];
        const seenChunkIds = new Set<string>();
        const allQueries: string[] = [];
        const completedTodos: AgentTodo[] = [
          completedCheckingTodo,
          completedPlanningTodo,
        ];
        let iteration = 1;
        let continueSearch = true;

        // Iterative search loop (agentic)
        while (continueSearch && iteration <= MAX_ITERATIONS) {
          const taskTodos: AgentTodo[] = tasks.map((task) => ({
            id: `${task.id}-iter${iteration}`,
            title: task.title,
            description: task.description,
            status: "pending" as const,
          }));

          const analyseTodo: AgentTodo = {
            id: `analyse-iter${iteration}`,
            title: "Checking completeness",
            description: "Verifying if more code is needed...",
            status: "pending",
          };

          tasks.forEach((t) => allQueries.push(t.searchQuery));
          updateTodos([...completedTodos, ...taskTodos, analyseTodo], {
            queries: allQueries,
          });

          const resultsPerTask: number[] = new Array(tasks.length).fill(0);

          // Execute each search task
          for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];

            const currentTodos = [
              ...completedTodos,
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

            // Semantic search on vector DB
            const searchResults = await Sentry.startSpan(
              {
                name: `vector_search_iter${iteration}_${i + 1}`,
                op: "vector.query",
                attributes: { repo, query: task.searchQuery },
              },
              async () =>
                await searchCodeChunks(task.searchQuery, repo, userId, 5),
            );

            resultsPerTask[i] = searchResults.length;

            // Add deduplicated results
            searchResults.forEach((chunk) => {
              if (!seenChunkIds.has(chunk.id)) {
                seenChunkIds.add(chunk.id);
                allSearchResults.push(chunk);
              }
            });
          }

          // Mark tasks complete
          const completedTaskTodos: AgentTodo[] = tasks.map((task, idx) => ({
            id: `${task.id}-iter${iteration}`,
            title: task.title,
            description: task.description,
            status: "completed" as const,
            result: `Found ${resultsPerTask[idx]} matches`,
          }));
          completedTodos.push(...completedTaskTodos);

          // Update sources
          const sources = new Map<
            string,
            { path: string; url: string; content?: string }
          >();
          allSearchResults.forEach((chunk) => {
            if (!sources.has(chunk.metadata.filePath)) {
              sources.set(chunk.metadata.filePath, {
                path: chunk.metadata.filePath,
                url: chunk.metadata.fileUrl,
                content: chunk.metadata.content,
              });
            }
          });

          if (allSearchResults.length === 0) {
            updateTodos(
              [
                ...completedTodos,
                { ...analyseTodo, status: "error", result: "No code found" },
              ],
              { loading: false, sources: Array.from(sources.values()) },
            );
            return { error: "no_results" };
          }

          // Check if we should continue (unless at max)
          if (iteration >= MAX_ITERATIONS) {
            continueSearch = false;
            completedTodos.push({
              ...analyseTodo,
              status: "completed",
              result: "Search complete",
            });
          } else {
            updateTodos(
              [...completedTodos, { ...analyseTodo, status: "in-progress" }],
              { sources: Array.from(sources.values()) },
            );

            // Analyse gaps
            const gapAnalysis = await Sentry.startSpan(
              {
                name: `analyze_gaps_indexed_iter${iteration}`,
                op: "ai.inference",
                attributes: {
                  model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
                  resultCount: allSearchResults.length,
                },
              },
              async () =>
                await generateObject({
                  model: openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1"),
                  system: analyseGapsSystemPrompt,
                  schema: z.object({
                    continueSearch: z.boolean(),
                    reasoning: z.string(),
                    additionalTasks: z.array(
                      z.object({
                        id: z.string(),
                        title: z.string(),
                        description: z.string(),
                        searchQuery: z.string(),
                      }),
                    ),
                  }),
                  prompt: analyseGapsUserPrompt(
                    query,
                    allSearchResults.map((r) => ({
                      path: r.metadata.filePath,
                      content: r.metadata.content,
                    })),
                    iteration,
                    MAX_ITERATIONS,
                  ),
                }),
            );

            const { continueSearch: shouldContinue, additionalTasks } =
              gapAnalysis.object;

            if (shouldContinue && additionalTasks.length > 0) {
              completedTodos.push({
                ...analyseTodo,
                status: "completed",
                result: `Found ${additionalTasks.length} more areas to explore`,
              });
              tasks = additionalTasks;
              iteration++;
            } else {
              continueSearch = false;
              completedTodos.push({
                ...analyseTodo,
                status: "completed",
                result: "All relevant code found",
              });
            }
          }
        }

        // Final: Generate the code graph
        const sources = new Map<
          string,
          { path: string; url: string; content?: string }
        >();
        allSearchResults.forEach((chunk) => {
          if (!sources.has(chunk.metadata.filePath)) {
            sources.set(chunk.metadata.filePath, {
              path: chunk.metadata.filePath,
              url: chunk.metadata.fileUrl,
              content: chunk.metadata.content,
            });
          }
        });

        const graphTodo: AgentTodo = {
          id: "generating",
          title: "Generating code graph",
          description: "Building relationship graph from collected code...",
          status: "in-progress",
        };
        updateTodos([...completedTodos, graphTodo], {
          analysing: true,
          sources: Array.from(sources.values()),
        });

        // Convert to format for graph generation
        const codeData = allSearchResults.map((chunk) => ({
          name: chunk.metadata.entityName,
          path: chunk.metadata.filePath,
          url: chunk.metadata.fileUrl,
          content: chunk.metadata.content,
        }));

        // Generate the code graph
        const result = await Sentry.startSpan(
          {
            name: "generate_code_graph_from_index",
            op: "ai.inference",
            attributes: {
              model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
              resultCount: allSearchResults.length,
              iterations: iteration,
            },
          },
          async () =>
            await generateObject({
              model: openai(process.env.OPENAI_CHAT_MODEL || "gpt-4.1"),
              maxOutputTokens: 32768,
              system: codeGraphSystemPrompt,
              schema: codeGraphGenerationSchema,
              prompt: codeGraphUserPrompt(codeData, query, repo),
            }),
        );

        const { nodes, edges } = result.object;

        // Validate edges
        const nodeIds = new Set(nodes.map((n) => n.id));
        const validEdges = edges.filter(
          (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
        );

        // Build additional edges from indexed metadata
        const metadataEdges = buildEdgesFromMetadata(allSearchResults, nodeIds);
        const allEdges = [...validEdges, ...metadataEdges];

        // Deduplicate edges
        const edgeSet = new Set<string>();
        const uniqueEdges = allEdges.filter((e) => {
          const key = `${e.source}->${e.target}`;
          if (edgeSet.has(key)) return false;
          edgeSet.add(key);
          return true;
        });

        Sentry.logger.info(
          `Generated ${nodes.length} nodes and ${uniqueEdges.length} edges from indexed data (${iteration} iterations)`,
        );

        const finalTodos = [
          ...completedTodos,
          {
            ...graphTodo,
            status: "completed" as const,
            result: `${nodes.length} nodes, ${uniqueEdges.length} relationships`,
          },
        ];

        writer.write({
          type: "data-codeGraph",
          data: {
            todos: finalTodos,
            nodes,
            edges: uniqueEdges,
            loading: false,
            analysing: false,
            queries: allQueries,
            sources: Array.from(sources.values()),
          },
          id,
        });

        return { data: { nodes, edges: uniqueEdges } };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "indexed_code_graph_failed" },
          extra: { query, repo, userId },
        });

        updateTodos(
          [
            {
              id: "error",
              title: "Code graph generation failed",
              description:
                error instanceof Error ? error.message : "Unknown error",
              status: "error",
            },
          ],
          { loading: false, analysing: false },
        );

        return { error: "code_graph_generation_failed" };
      }
    },
  });
};

/**
 * Build edges from indexed metadata (imports, inheritance, function calls)
 */
function buildEdgesFromMetadata(
  chunks: { id: string; metadata: CodeChunkMetadata }[],
  nodeIds: Set<string>,
): {
  source: string;
  target: string;
  label?: string;
  type?: "imports" | "calls" | "extends" | "uses";
}[] {
  const edges: {
    source: string;
    target: string;
    label?: string;
    type?: "imports" | "calls" | "extends" | "uses";
  }[] = [];

  // Create lookup maps
  const chunksByName = new Map<string, string[]>();
  const chunksByFile = new Map<string, string[]>();

  chunks.forEach((chunk) => {
    const name = chunk.metadata.entityName.toLowerCase();
    if (!chunksByName.has(name)) chunksByName.set(name, []);
    chunksByName.get(name)!.push(chunk.id);

    const file = chunk.metadata.filePath;
    if (!chunksByFile.has(file)) chunksByFile.set(file, []);
    chunksByFile.get(file)!.push(chunk.id);
  });

  chunks.forEach((chunk) => {
    const sourceId = `${chunk.metadata.filePath}::${chunk.metadata.entityName}`;
    if (!nodeIds.has(sourceId)) return;

    // Inheritance edges
    if (chunk.metadata.parentClass) {
      const parentName = chunk.metadata.parentClass.toLowerCase();
      const parentChunks = chunksByName.get(parentName);
      if (parentChunks) {
        parentChunks.forEach((targetChunkId) => {
          const targetChunk = chunks.find((c) => c.id === targetChunkId);
          if (targetChunk) {
            const targetId = `${targetChunk.metadata.filePath}::${targetChunk.metadata.entityName}`;
            if (nodeIds.has(targetId) && sourceId !== targetId) {
              edges.push({
                source: sourceId,
                target: targetId,
                label: "extends",
                type: "extends",
              });
            }
          }
        });
      }
    }

    // Function call edges
    if (chunk.metadata.calledFunctions) {
      chunk.metadata.calledFunctions.forEach((funcName) => {
        const funcChunks = chunksByName.get(funcName.toLowerCase());
        if (funcChunks) {
          funcChunks.forEach((targetChunkId) => {
            const targetChunk = chunks.find((c) => c.id === targetChunkId);
            if (targetChunk && targetChunk.metadata.entityType === "function") {
              const targetId = `${targetChunk.metadata.filePath}::${targetChunk.metadata.entityName}`;
              if (nodeIds.has(targetId) && sourceId !== targetId) {
                edges.push({
                  source: sourceId,
                  target: targetId,
                  label: `calls ${funcName}`,
                  type: "calls",
                });
              }
            }
          });
        }
      });
    }
  });

  return edges;
}

/**
 * Create the tools object for the AI agent.
 *
 * @param writer - The UI message stream writer
 * @param userId - The user's ID (optional)
 * @param indexedRepos - List of repository full names that have been indexed (optional)
 *
 * Both code graph tools are always included when userId is provided.
 * The tool descriptions include the list of indexed repos so the agent
 * knows which tool to use for each repository:
 * - visualiseCodeGraphIndexed: For indexed repos (faster, uses vector search)
 * - visualiseCodeGraph: For non-indexed repos (uses live GitHub API)
 */
export const tools = (
  writer: UIMessageStreamWriter,
  userId?: string,
  indexedRepos?: string[],
) => {
  return {
    getWeatherInformation: getWeatherInformation(writer),
    getRepositories: getRepositories(writer),
    // Always include non-indexed version (description tells agent when to use it)
    visualiseCodeGraph: visualiseCodeGraph(writer, indexedRepos),
    // Include indexed version only if userId is provided
    ...(userId
      ? {
          visualiseCodeGraphIndexed: visualiseCodeGraphIndexed(
            writer,
            userId,
            indexedRepos,
          ),
        }
      : {}),
  };
};
