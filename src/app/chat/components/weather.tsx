import { MyDataPart } from "@/types/ui-message-type";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getWeatherStyles = (
  weather: MyDataPart["weather"]["weather"] | undefined
) => {
  if (!weather) return { bg: "bg-muted", border: "border-muted-foreground/20" };

  switch (weather) {
    case "Clear":
      return {
        bg: "bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20",
        border: "border-yellow-300 dark:border-yellow-700",
      };
    case "Clouds":
      return {
        bg: "bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20",
        border: "border-gray-300 dark:border-gray-700",
      };
    case "Rain":
    case "Drizzle":
      return {
        bg: "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20",
        border: "border-blue-300 dark:border-blue-700",
      };
    case "Snow":
      return {
        bg: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
        border: "border-blue-200 dark:border-blue-800",
      };
    case "Thunderstorm":
      return {
        bg: "bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20",
        border: "border-purple-300 dark:border-purple-700",
      };
    case "Mist":
    case "Fog":
    case "Haze":
      return {
        bg: "bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950/20 dark:to-blue-950/20",
        border: "border-gray-200 dark:border-gray-800",
      };
    case "Smoke":
    case "Dust":
    case "Sand":
    case "Ash":
      return {
        bg: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20",
        border: "border-orange-200 dark:border-orange-800",
      };
    case "Squall":
    case "Tornado":
      return {
        bg: "bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20",
        border: "border-red-300 dark:border-red-700",
      };
    case "Unknown":
      return {
        bg: "bg-gradient-to-br from-neutral-100 to-slate-100 dark:from-neutral-900/20 dark:to-slate-900/20",
        border: "border-neutral-300 dark:border-neutral-700",
      };
    default:
      return {
        bg: "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/20 dark:to-blue-900/20",
        border: "border-sky-300 dark:border-sky-700",
      };
  }
};

const getWeatherEmoji = (
  weather: MyDataPart["weather"]["weather"] | undefined
) => {
  if (!weather) return "⏳";

  switch (weather) {
    case "Clear":
      return "☀️";
    case "Clouds":
      return "☁️";
    case "Rain":
      return "🌧️";
    case "Drizzle":
      return "🌦️";
    case "Snow":
      return "❄️";
    case "Thunderstorm":
      return "⛈️";
    case "Mist":
    case "Fog":
      return "🌫️";
    case "Haze":
      return "🌥️";
    case "Smoke":
      return "💨";
    case "Dust":
    case "Sand":
      return "�️";
    case "Ash":
      return "🌋";
    case "Squall":
      return "💨";
    case "Tornado":
      return "🌪️";
    case "Unknown":
      return "❓";
    default:
      return "🌤️";
  }
};

const getWeatherBadgeVariant = (
  weather: MyDataPart["weather"]["weather"] | undefined
) => {
  if (!weather) return "secondary";

  switch (weather) {
    case "Clear":
      return "default";
    case "Clouds":
      return "secondary";
    case "Rain":
    case "Drizzle":
      return "destructive";
    case "Snow":
      return "outline";
    case "Thunderstorm":
      return "destructive";
    case "Mist":
    case "Fog":
    case "Haze":
      return "secondary";
    case "Smoke":
    case "Dust":
    case "Sand":
    case "Ash":
      return "destructive";
    case "Squall":
    case "Tornado":
      return "destructive";
    case "Unknown":
      return "secondary";
    default:
      return "default";
  }
};

export const Weather = ({ data }: { data: MyDataPart["weather"] }) => {
  const weatherStyle = getWeatherStyles(data.weather);
  const weatherEmoji = getWeatherEmoji(data.weather);
  const badgeVariant = getWeatherBadgeVariant(data.weather);

  const isLoading = data.loading;

  return (
    <TooltipProvider>
      <Card
        className={`${weatherStyle.bg} ${weatherStyle.border} border-2 shadow-lg transition-all duration-500 ease-in-out hover:shadow-xl`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-3xl transition-transform hover:scale-110">
                    {weatherEmoji}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Current weather condition</p>
                </TooltipContent>
              </Tooltip>
              <div className="space-y-1">
                {isLoading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <h3 className="text-lg font-semibold leading-none">
                    {data.location}
                  </h3>
                )}
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <Badge variant={badgeVariant} className="text-xs">
                    {data.weather}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              {isLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-3xl font-light tracking-tight">
                      {data.temperature}°
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Temperature in Celsius</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Weather Status</span>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-4 w-4 rounded-full" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
              <span className="text-xs">
                {isLoading ? "Loading..." : "Live"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
