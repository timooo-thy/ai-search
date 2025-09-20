import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StockData, TimeData, WeatherData } from "@/types/widget-types";
import { Cloud, Loader2, TrendingUp } from "lucide-react";

type WidgetCardProps = {
  timeData: TimeData | null;
  stockData: StockData | null;
  weatherData: WeatherData | null;
  loading: {
    time: boolean;
    stock: boolean;
    weather: boolean;
  };
};

export default function WidgetCards({
  timeData,
  stockData,
  weatherData,
  loading,
}: WidgetCardProps) {
  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDay = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Time Widget */}
      <Card className="p-4 text-white border-0 cursor-pointer hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-slate-500 to-slate-800">
        <div className="space-y-2">
          {loading.time ? (
            <div className="flex items-center justify-center h-16">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="text-xs opacity-80">
                {timeData ? formatDay(timeData.datetime) : "SAT"}
              </div>
              <div className="text-2xl font-bold">
                {timeData ? formatTime(timeData.datetime) : "12:45"}
              </div>
              <div className="text-sm opacity-90">{timeData?.timezone}</div>
            </>
          )}
        </div>
      </Card>

      {/* Stock Widget */}
      <Card className="p-4 text-white border-0 cursor-pointer hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-emerald-400 to-teal-600">
        <div className="space-y-2">
          {loading.stock ? (
            <div className="flex items-center justify-center h-16">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">
                    {stockData?.symbol || "NVDA"}
                  </div>
                </div>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold">
                ${stockData?.price?.toFixed(2) || "176.67"}
              </div>
              <div
                className={cn(
                  "text-xs",
                  stockData && stockData.change >= 0
                    ? "text-green-200"
                    : "text-red-200"
                )}
              >
                {stockData
                  ? `${
                      stockData.change >= 0 ? "+" : ""
                    }${stockData.changePercent.toFixed(2)}%`
                  : "+0.24%"}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Weather Widget */}
      <Card className="p-4 text-white border-0 cursor-pointer hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-blue-400 to-indigo-600">
        <div className="space-y-2">
          {loading.weather ? (
            <div className="flex items-center justify-center h-16">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">
                  {weatherData?.temperature || 27}°C
                </div>
                <Cloud className="h-5 w-5" />
              </div>
              <div className="text-xs opacity-90">
                {weatherData?.description || "Mostly cloudy"}
              </div>
              <div className="text-sm opacity-80">
                {weatherData?.location || "Singapore"}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
