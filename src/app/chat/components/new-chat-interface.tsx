"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Database, Send } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { StockData, TimeData, WeatherData } from "@/types/widget-types";
import WidgetCards from "./widget-cards";
import { useRouter } from "next/navigation";
import { createChat } from "@/actions/ui-message-actions";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NewChatInterfaceProps = {
  hasValidGithubPAT: boolean;
  indexedRepos: { repoFullName: string }[];
};

export function NewChatInterface({
  hasValidGithubPAT,
  indexedRepos,
}: NewChatInterfaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndexedRepo, setSelectedIndexedRepo] = useState("");
  const [timeData, setTimeData] = useState<TimeData | null>(null);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState({
    time: true,
    stock: true,
    weather: true,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    try {
      const chat = await createChat(
        searchQuery,
        selectedIndexedRepo || undefined,
      );
      router.push(`/chat/${chat.id}?query=${encodeURIComponent(searchQuery)}`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: "create_chat_failure" },
      });
      toast.error("Failed to create chat. Please try again.");
    }
  };

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const response = await fetch(
          "https://api.api-ninjas.com/v1/worldtime?lat=1.3521&lon=103.8198",
          {
            headers: (() => {
              const key = process.env.NEXT_PUBLIC_API_NINJAS_KEY;
              if (!key) throw new Error("API_NINJAS key missing");
              return { "X-Api-Key": key };
            })(),
          }
        );
        const data = await response.json();
        setTimeData(data);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "time_fetch_failed" },
        });
        toast.error("Error fetching time data.");

        setTimeData({
          datetime: new Date().toISOString(),
          timezone: "Asia/Singapore",
          day_of_week: new Date().getDay(),
        });
      } finally {
        setLoading((prev) => ({ ...prev, time: false }));
      }
    };

    fetchTime();
  }, []);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await fetch(
          (() => {
            const key = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;
            if (!key) throw new Error("ALPHA_VANTAGE key missing");
            return `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${key}`;
          })()
        );
        const data = await response.json();

        if (data["Global Quote"]) {
          const quote = data["Global Quote"];
          setStockData({
            symbol: quote["01. symbol"],
            price: parseFloat(quote["05. price"]),
            change: parseFloat(quote["09. change"]),
            changePercent: parseFloat(
              quote["10. change percent"].replace("%", "")
            ),
          });
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "stock_fetch_failed" },
        });
        toast.error("Error fetching stock data.");

        setStockData({
          symbol: "NVDA",
          price: 176.67,
          change: 0.24,
          changePercent: 0.14,
        });
      } finally {
        setLoading((prev) => ({ ...prev, stock: false }));
      }
    };

    fetchStock();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          (() => {
            const key = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
            if (!key) throw new Error("OPENWEATHER key missing");
            return `https://api.openweathermap.org/data/2.5/weather?q=Singapore&appid=${key}&units=metric`;
          })()
        );
        const data = await response.json();

        if (data.main) {
          setWeatherData({
            temperature: Math.round(data.main.temp),
            description:
              data.weather[0].description.charAt(0).toUpperCase() +
              data.weather[0].description.slice(1),
            location: data.name,
          });
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "weather_fetch_failed" },
        });
        toast.error("Error fetching weather data.");

        setWeatherData({
          temperature: 27,
          description: "Mostly cloudy",
          location: "Singapore",
        });
      } finally {
        setLoading((prev) => ({ ...prev, weather: false }));
      }
    };

    fetchWeather();
  }, []);

  return hasValidGithubPAT ? (
    <div className="flex flex-col flex-1 items-center justify-center bg-primary-foreground p-6">
      <div className="w-full max-w-4xl space-y-10">
        <h1 className="text-5xl font-bold text-center text-primary">
          CodeOrient
        </h1>

        <div className="flex justify-center">
          <div className="w-full flex-col flex max-w-2xl gap-3">
            <div className="relative">
              <Textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Ask anything. Start simple with your Github Repository."
                className="w-full resize-none pl-4 pr-20 pb-14 bg-card border-border rounded-xl shadow-lg focus:ring-2 focus:ring-primary"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto">
                  {indexedRepos.length > 0 && (
                    <Select
                      value={selectedIndexedRepo || "__all__"}
                      onValueChange={(value) =>
                        setSelectedIndexedRepo(
                          value === "__all__" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="h-8 w-auto max-w-[220px] rounded-lg border-none bg-muted/60 shadow-none text-xs hover:bg-muted"
                      >
                        <Database className="h-3 w-3 mr-1" />
                        <SelectValue placeholder="Select repo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">
                          All repositories
                        </SelectItem>
                        {indexedRepos.map((repo) => (
                          <SelectItem
                            key={repo.repoFullName}
                            value={repo.repoFullName}
                          >
                            {repo.repoFullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="pointer-events-auto">
                  <Button
                    onClick={handleSearch}
                    size="sm"
                    className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                    disabled={!searchQuery.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <WidgetCards
          loading={loading}
          timeData={timeData}
          stockData={stockData}
          weatherData={weatherData}
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center bg-primary-foreground justify-center h-full text-center p-10">
      <h2 className="text-2xl font-semibold mb-4">
        Connect your GitHub account
      </h2>
      <p className="text-muted-foreground mb-6">
        To use the chat features, please connect your GitHub account by
        providing a Personal Access Token (PAT).
      </p>
      <Link
        href="/settings"
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
      >
        Go to Settings
      </Link>
    </div>
  );
}
