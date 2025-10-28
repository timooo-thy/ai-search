"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, GithubIcon, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";

type Source = {
  path: string;
  url: string;
};

type SourcesDialogProps = {
  sources: Source[];
};

export function SourcesDialog({ sources }: SourcesDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            Sentry.startSpan(
              {
                name: "Open Sources Dialog",
                op: "ui.click",
              },
              (span) => {
                span?.setAttribute("sources.count", sources.length);
              }
            );
          }}
          className="gap-2 hover:bg-accent/50 text-muted-foreground hover:text-foreground bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <Globe className="h-4 w-4" />
          {sources.length} sources
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {sources.length} sources
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 px-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GithubIcon className="h-4 w-4" />
              <span className="font-bold">GitHub</span>
            </div>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <a
                  key={`${source.url}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "block p-4 rounded-lg border border-border",
                    "hover:bg-muted/50 transition-colors group"
                  )}
                  onClick={() => {
                    Sentry.startSpan(
                      {
                        name: "Click Source Link",
                        op: "ui.click",
                      },
                      (span) => {
                        span?.setAttribute("source.path", source.path);
                        span?.setAttribute("source.url", source.url);
                        span?.setAttribute("source.index", index);
                      }
                    );
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                        {source.path}
                      </h4>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
