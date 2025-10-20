"use client";

import { Position, Handle } from "reactflow";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CodeGraphNode } from "@/types/widget-types";
import { CodePreview } from "./code-preview";
import {
  getNodeColor,
  getNodeIcon,
  getLanguageFromFilePath,
} from "./graph-utils";

type CustomCodeNodeProps = {
  data: CodeGraphNode;
};

export function CustomCodeNode({ data }: CustomCodeNodeProps) {
  const lang = getLanguageFromFilePath(data.filePath);

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "px-4 py-2 rounded-lg border-2 shadow-lg cursor-pointer transition-all hover:scale-105 hover:shadow-xl",
            "bg-card text-card-foreground border-border hover:border-primary/50",
            "min-w-[120px] text-center relative backdrop-blur-sm"
          )}
        >
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 bg-primary border-2 border-background"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 bg-primary border-2 border-background"
          />
          <div className="flex items-center gap-2 justify-center">
            <span className="text-lg">{getNodeIcon(data.type)}</span>
            <span className="text-sm font-medium truncate max-w-[150px]">
              {data.label}
            </span>
          </div>
          {data.type && (
            <div
              className={cn(
                "text-xs mt-1 px-2 py-0.5 rounded-full inline-block font-medium",
                getNodeColor(data.type),
                "text-white shadow-sm"
              )}
            >
              {data.type}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="w-[600px] max-w-[90vw] p-0 border-2 z-50 shadow-xl"
        sideOffset={15}
      >
        <Card className="overflow-hidden">
          <div className="px-4 pb-3 pt-0 border-b border-border bg-muted/30">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getNodeIcon(data.type)}</span>
                <p className="text-sm font-semibold">{data.label}</p>
              </div>
              {data.filePath && (
                <p className="text-xs text-muted-foreground font-mono bg-background/80 px-2 py-1 rounded">
                  {data.filePath}
                </p>
              )}
              {data.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {data.description}
                </p>
              )}
            </div>
          </div>

          {data.codeSnippet && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Code Preview
                </p>
                <span className="text-xs text-muted-foreground font-mono bg-background/80 px-2 py-1 rounded">
                  {lang}
                </span>
              </div>
              <CodePreview code={data.codeSnippet} language={lang} />
            </div>
          )}
        </Card>
      </TooltipContent>
    </Tooltip>
  );
}
