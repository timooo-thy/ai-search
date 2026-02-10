"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyIcon, CheckIcon } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UserCopyButtonProps {
  text: string;
}

export function UserCopyButton({ text }: UserCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200"
            onClick={handleCopy}
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Copy</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{copied ? "Copied!" : "Copy"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
