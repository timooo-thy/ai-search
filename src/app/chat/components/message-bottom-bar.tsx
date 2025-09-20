"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Share,
  RotateCcw,
  BookmarkPlus,
  CopyIcon,
  ComputerIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBottomBarProps {
  className?: string;
  onShare?: () => void;
  onCopy?: () => void;
  onRewrite?: () => void;
  modelDetails: string;
}

export function MessageBottomBar({
  className,
  onShare,
  onCopy,
  onRewrite,
  modelDetails,
}: MessageBottomBarProps) {
  const buttons = [
    {
      icon: Share,
      label: "Share",
      onClick: onShare,
    },
    {
      icon: CopyIcon,
      label: "Copy",
      onClick: onCopy,
    },
    {
      icon: RotateCcw,
      label: "Rewrite",
      onClick: onRewrite,
    },
    {
      icon: ComputerIcon,
      label: modelDetails,
    },
  ];

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          className
        )}
      >
        {buttons.map((button) => {
          const Icon = button.icon;
          return (
            <Tooltip key={button.label}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={button.onClick}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{button.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{button.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
