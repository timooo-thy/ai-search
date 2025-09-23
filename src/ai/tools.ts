import { MyDataPart } from "@/types/ui-message-type";
import {
  InferToolInput,
  InferToolOutput,
  tool,
  UIMessage,
  UIMessageStreamWriter,
} from "ai";
import z from "zod/v4";

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

// types used in our db schema
export type getWeatherInformationInput = InferToolInput<
  ReturnType<typeof getWeatherInformation>
>;
export type getWeatherInformationOutput = InferToolOutput<
  ReturnType<typeof getWeatherInformation>
>;

export const getLocation = tool({
  description: "Get the user location.",
  inputSchema: z.object({}),
  // client side tool requires typing the output schema explicitly
  outputSchema: z.object({ location: z.string() }),
});

export type getLocationInput = InferToolInput<typeof getLocation>;
export type getLocationOutput = InferToolOutput<typeof getLocation>;

export const tools = (writer: UIMessageStreamWriter) => ({
  getWeatherInformation: getWeatherInformation(writer), // pipe in stream writer
  getLocation,
});
