import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "@/lib/utils";

export const Tip = ({
  content,
  children,
  className,
  delayDuration,
  toolTipClassName,
}: React.PropsWithChildren<{
  content: string | React.ReactNode;
  className?: string;
  delayDuration?: number;
  toolTipClassName?: string;
}>) => {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={delayDuration ?? 0}>
      <Tooltip open={open}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn("cursor-pointer", className)}
            onClick={() => setOpen(!open)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onTouchStart={() => setOpen(!open)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setOpen(!open);
              }
            }}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className={cn(!content ? "hidden" : "", toolTipClassName)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <span className="inline-block">{content}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
