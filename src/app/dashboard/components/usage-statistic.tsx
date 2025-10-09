import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UsageStatisticProps = {
  usageStats: {
    totalSearches: number;
    totalChats: number;
    totalMessages: number;
  };
};

export default function UsageStatistic({ usageStats }: UsageStatisticProps) {
  const avgMessagesPerChat = usageStats?.totalChats
    ? Math.round((usageStats.totalMessages / usageStats.totalChats) * 10) / 10
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-lg">📈</span>
          <span>Usage Stats</span>
        </CardTitle>
        <CardDescription>
          Your productivity metrics and search insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Lifetime Searches</span>
            <span className="text-2xl font-bold text-primary">
              {usageStats.totalSearches}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Repository Analysed</span>
            <span className="text-2xl font-bold text-primary">3</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Average Messages per Chat
            </span>
            <span className="text-2xl font-bold text-primary">
              {avgMessagesPerChat}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Messages</span>
            <span className="text-2xl font-bold text-primary">
              {usageStats.totalMessages}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
