"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { StockData, TimeData, WeatherData } from "@/types/widget-types";
import WidgetCards from "./widget-cards";
import { useRouter } from "next/navigation";
import { createChat } from "@/actions/ui-message-actions";

export function NewChatInterface() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
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
    const chat = await createChat(searchQuery);
    router.push(`/chat/${chat.id}?query=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const response = await fetch(
          "https://api.api-ninjas.com/v1/worldtime?lat=1.3521&lon=103.8198",
          {
            headers: { "X-Api-Key": process.env.NEXT_PUBLIC_API_NINJAS_KEY! },
          }
        );
        const data = await response.json();
        setTimeData(data);
      } catch (error) {
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
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY}`
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
          `https://api.openweathermap.org/data/2.5/weather?q=Singapore&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_KEY}&units=metric`
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

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-primary-foreground p-6">
      <div className="w-full max-w-4xl space-y-10">
        <h1 className="text-5xl font-bold text-center text-primary">
          CodeOrient
        </h1>

        <div className="flex justify-center">
          <div className="w-full flex-col flex max-w-2xl">
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
              className="w-full resize-none pl-4 pr-20 bg-card border-border rounded-xl shadow-lg focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end -mt-10 mr-2">
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

        <WidgetCards
          loading={loading}
          timeData={timeData}
          stockData={stockData}
          weatherData={weatherData}
        />
      </div>
    </div>
  );
}
