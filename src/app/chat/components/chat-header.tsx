"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, ShareIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatHeader() {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmarkToggle = () => {
    Sentry.startSpan(
      {
        name: "bookmark.toggle",
        op: "ui.action.click",
        attributes: {
          isBookmarked: !isBookmarked,
        },
      },
      () => {
        setIsBookmarked(!isBookmarked);
        // TODO: Add bookmark save logic here
      }
    );
  };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b bg-card text-card-foreground ">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="hover:bg-accent/50" />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmarkToggle}
          className="hover:bg-accent/50"
        >
          <BookmarkIcon
            className={cn(
              "h-4 w-4 transition-all",
              isBookmarked && "fill-primary text-primary"
            )}
          />
        </Button>
        <Button variant="ghost" size="sm" className="hover:bg-accent/50">
          <ShareIcon className="h-4 w-4 " />
        </Button>
        <ModeToggle />
      </div>
    </div>
  );
}
