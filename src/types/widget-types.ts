export type TimeData = {
  datetime: string;
  timezone: string;
  day_of_week: number;
};

export type StockData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

export type WeatherData = {
  temperature: number;
  description: string;
  location: string;
};
