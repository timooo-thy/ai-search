"use client";

import { useState, useRef, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import * as Sentry from "@sentry/nextjs";

type CodePreviewProps = {
  code: string;
  language?: string;
};

export function CodePreview({
  code,
  language = "typescript",
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);
  const { theme = "light" } = useTheme();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);

      if (isMountedRef.current) {
        setCopied(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setCopied(false);
          }
          timeoutRef.current = null;
        }, 2000);
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: "code_copy_failure" },
      });
      if (isMountedRef.current) {
        setCopied(false);
      }
    }
  };

  return (
    <div className="relative group h-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 z-10 h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity",
          "bg-background/95 hover:bg-background border border-border backdrop-blur-sm shadow-sm"
        )}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            <span className="text-xs">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3 mr-1" />
            <span className="text-xs">Copy</span>
          </>
        )}
      </Button>
      <SyntaxHighlighter
        language={language}
        style={theme === "dark" ? oneDark : oneLight}
        showLineNumbers={true}
        wrapLines={true}
        lineProps={{
          style: {
            fontSize: 12,
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
          },
        }}
        codeTagProps={{
          style: {
            fontFamily: "inherit",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
