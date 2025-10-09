"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

type RecentSearchProps = {
  recentChats: { id: string; title: string; updatedAt: Date }[];
};

export default function RecentSearch({ recentChats }: RecentSearchProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-lg">🕐</span>
          <span>Recent Searches</span>
        </CardTitle>
        <CardDescription>
          Your latest AI-powered code searches and discoveries.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <div className="space-y-4 h-full">
          {recentChats.length > 0 ? (
            recentChats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-secondary/50 border"
              >
                <div>
                  <p className="font-medium text-sm">{chat.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {chat.updatedAt.toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    router.push(`/chat/${chat.id}`);
                  }}
                >
                  View
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-muted-foreground text-center py-4 h-full flex items-center justify-center">
              No recent searches yet. Start a new search to see your history
              here.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
