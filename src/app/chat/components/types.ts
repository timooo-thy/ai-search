export interface Message {
  id: number;
  role: "assistant" | "user";
  content: string;
  time: string;
}

export const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! How can I help you today?",
    time: "09:00",
  },
  {
    id: 2,
    role: "user",
    content: "What is the weather like in Singapore?",
    time: "09:01",
  },
  {
    id: 3,
    role: "assistant",
    content: "It's currently 32°C and sunny in Singapore.",
    time: "09:01",
  },
];
