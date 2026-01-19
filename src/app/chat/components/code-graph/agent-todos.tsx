"use client";

import { AgentTodo } from "@/types/ui-message-type";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useEffect } from "react";

type AgentTodosProps = {
  todos: AgentTodo[];
  className?: string;
  defaultOpen?: boolean;
};

const statusIcons = {
  pending: Circle,
  "in-progress": Loader2,
  completed: CheckCircle2,
  error: XCircle,
};

const statusStyles = {
  pending: "text-muted-foreground",
  "in-progress": "text-primary animate-spin",
  completed: "text-green-600",
  error: "text-destructive",
};

/**
 * Displays a collapsible list of agent todos with status indicators
 * Auto-collapses when all tasks are complete
 */
export function AgentTodos({
  todos,
  className,
  defaultOpen = true,
}: AgentTodosProps) {
  const completedCount = todos.filter((t) => t.status === "completed").length;
  const totalCount = todos.length;
  const hasErrors = todos.some((t) => t.status === "error");
  const isInProgress = todos.some((t) => t.status === "in-progress");
  const allComplete = completedCount === totalCount && !hasErrors;

  // Auto-collapse when all tasks complete
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (allComplete) {
      const timer = setTimeout(() => setIsOpen(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [allComplete]);

  if (!todos || todos.length === 0) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-full", className)}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors group">
        <div className="flex items-center gap-3">
          {isInProgress ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : hasErrors ? (
            <XCircle className="w-4 h-4 text-destructive" />
          ) : allComplete ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {isInProgress
              ? "Exploring codebase..."
              : hasErrors
              ? "Completed with errors"
              : allComplete
              ? "Exploration complete"
              : "Pending tasks"}
          </span>
          <span className="text-xs text-muted-foreground">
            ({completedCount}/{totalCount} tasks)
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 max-h-64 overflow-y-auto space-y-1.5">
        {todos.map((todo) => {
          const Icon = statusIcons[todo.status];

          return (
            <div
              key={todo.id}
              className={cn(
                "flex items-start gap-3 p-2.5 rounded-md transition-all duration-200",
                todo.status === "in-progress" &&
                  "bg-primary/5 border border-primary/20",
                todo.status === "completed" &&
                  "bg-green-50/50 dark:bg-green-950/10",
                todo.status === "error" &&
                  "bg-destructive/5 border border-destructive/20",
                todo.status === "pending" && "bg-muted/20"
              )}
            >
              <div className="shrink-0 mt-0.5">
                <Icon className={cn("w-4 h-4", statusStyles[todo.status])} />
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "text-sm font-medium",
                    todo.status === "completed" &&
                      "text-green-700 dark:text-green-400",
                    todo.status === "error" && "text-destructive",
                    todo.status === "in-progress" && "text-primary",
                    todo.status === "pending" && "text-muted-foreground"
                  )}
                >
                  {todo.title}
                </span>
                {todo.result && (
                  <span
                    className={cn(
                      "text-xs ml-2 truncate",
                      todo.status === "completed" &&
                        "text-green-600/80 dark:text-green-400/80",
                      todo.status === "error" && "text-destructive/80"
                    )}
                    title={todo.result}
                  >
                    •{" "}
                    {todo.result.length > 40
                      ? todo.result.slice(0, 40) + "..."
                      : todo.result}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
