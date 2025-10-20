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

export type CodeGraphNode = {
  id: string;
  label: string;
  type?: "file" | "function" | "class" | "component";
  filePath?: string;
  codeSnippet?: string;
  description?: string;
};

export type CodeGraphEdge = {
  source: string;
  target: string;
  label?: string;
  type?: "imports" | "calls" | "extends" | "uses";
};
