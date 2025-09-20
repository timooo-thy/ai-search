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
  CopyIcon,
  ComputerIcon,
  CheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

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
  const [clickedButtons, setClickedButtons] = useState<Set<string>>(new Set());

  const handleButtonClick = useCallback(
    (
      buttonKey: string,
      originalHandler?: () => void,
      showTick: boolean = true
    ) => {
      return async () => {
        if (originalHandler) {
          originalHandler();
        }

        if (showTick) {
          setClickedButtons((prev) => new Set(prev).add(buttonKey));

          setTimeout(() => {
            setClickedButtons((prev) => {
              const newSet = new Set(prev);
              newSet.delete(buttonKey);
              return newSet;
            });
          }, 2000);
        }
      };
    },
    []
  );

  const buttons = [
    {
      key: "share",
      icon: Share,
      label: "Share",
      onClick: handleButtonClick("share", onShare, true),
      showTick: true,
    },
    {
      key: "copy",
      icon: CopyIcon,
      label: "Copy",
      onClick: handleButtonClick("copy", onCopy, true),
      showTick: true,
    },
    {
      key: "rewrite",
      icon: RotateCcw,
      label: "Rewrite",
      onClick: handleButtonClick("rewrite", onRewrite, false),
      showTick: false,
    },
    {
      key: "model",
      icon: ComputerIcon,
      label: modelDetails,
      onClick: undefined,
      showTick: false,
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
          const isClicked = clickedButtons.has(button.key);
          const Icon = isClicked && button.showTick ? CheckIcon : button.icon;

          return (
            <Tooltip key={button.key}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors",
                    isClicked && button.showTick
                  )}
                  onClick={button.onClick}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{button.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isClicked && button.showTick ? "Copied!" : button.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
