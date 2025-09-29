import { MyDataPart } from "@/types/ui-message-type";
import { tool, UIMessage, UIMessageStreamWriter } from "ai";
import z from "zod";
import { Octokit } from "octokit";
import { getUserRepos } from "@/actions/github-actions";

export const getWeatherInformation = (
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>
) =>
  tool({
    description: "show the weather in a given city to the user",
    inputSchema: z.object({ city: z.string() }),
    execute: async ({ city }, { toolCallId: id }) => {
      writer.write({
        type: "data-weather",
        data: { location: city, weather: undefined, loading: true },
        id,
      });

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_KEY}&units=metric`
      );

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
    },
  });

export const getRepositories = (
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>
) =>
  tool({
    description: "Get the top 30 GitHub repositories of current user.",
    inputSchema: z.object({}),
    execute: async (_input, { toolCallId: id }) => {
      writer.write({
        type: "data-repositories",
        data: { details: [], loading: true },
        id,
      });

      const response = await getUserRepos();

      if (!response) {
        writer.write({
          type: "data-repositories",
          data: { details: [], loading: false },
          id,
        });
        return { data: [] };
      }

      const details = response.data.map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
      }));

      writer.write({
        type: "data-repositories",
        data: {
          loading: false,
          details,
        },
        id,
      });

      return { data: details };
    },
  });

export const tools = (writer: UIMessageStreamWriter) => ({
  getWeatherInformation: getWeatherInformation(writer),
  getRepositories: getRepositories(writer),
});
