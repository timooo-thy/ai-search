"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExternalLink,
  FileCode2,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  FolderCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "../memoized-markdown";
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockItem,
  type BundledLanguage,
} from "@/components/kibo-ui/code-block";

type Source = {
  path: string;
  url: string;
  content?: string;
};

type CodeEditorPanelProps = {
  sources: Source[];
  children: React.ReactNode;
};

// Map file extensions to Shiki language identifiers
const getLanguageFromPath = (path: string): BundledLanguage => {
  const fileName = path.split("/").pop() ?? "";
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase()
    : fileName.toLowerCase();
  const languageMap: Record<string, BundledLanguage> = {
    ts: "ts",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    php: "php",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "md",
    mdx: "mdx",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    dockerfile: "dockerfile",
    graphql: "graphql",
    vue: "vue",
    svelte: "svelte",
    prisma: "prisma",
    xml: "xml",
    toml: "toml",
    makefile: "makefile",
  };
  return languageMap[ext ?? ""] ?? "typescript";
};

export function CodeEditorPanel({ sources, children }: CodeEditorPanelProps) {
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<number | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const sourcesWithContent = sources.filter(
    (s) => s.content && s.content.trim().length > 0,
  );
  const selectedSource =
    selectedSourceIndex !== null
      ? sourcesWithContent[selectedSourceIndex]
      : null;
  const isPanelOpen = selectedSource !== null;

  const handleCopy = async () => {
    if (selectedSource?.content) {
      try {
        await navigator.clipboard.writeText(selectedSource.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "clipboard_copy" },
        });
      }
    }
  };

  const handleClose = () => {
    setSelectedSourceIndex(null);
  };

  const handlePrevious = () => {
    if (selectedSourceIndex !== null && selectedSourceIndex > 0) {
      setSelectedSourceIndex(selectedSourceIndex - 1);
    }
  };

  const handleNext = () => {
    if (
      selectedSourceIndex !== null &&
      selectedSourceIndex < sourcesWithContent.length - 1
    ) {
      setSelectedSourceIndex(selectedSourceIndex + 1);
    }
  };

  const fileName = selectedSource?.path.split("/").pop() ?? "";
  const language = selectedSource
    ? getLanguageFromPath(selectedSource.path)
    : "typescript";

  if (sourcesWithContent.length === 0) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="h-full w-full overflow-hidden"
        style={{ contain: "strict" }}
      >
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel
            defaultSize={isPanelOpen ? 50 : 100}
            minSize={30}
            maxSize={70}
          >
            <div className="h-full flex flex-col overflow-hidden">
              {/* Main content (graph) */}
              <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
              {/* Source tabs bar at the bottom */}
              <div className="border-t bg-card shrink-0">
                <div className="flex items-center h-12 px-4 gap-2">
                  <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-border/50">
                    <FolderCode className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {sourcesWithContent.length} file
                      {sourcesWithContent.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div
                    className="flex-1 overflow-x-auto min-w-0"
                    style={{ scrollbarWidth: "thin" }}
                  >
                    <div className="flex items-center gap-1.5 w-max py-1">
                      {sourcesWithContent.map((source, index) => {
                        const name =
                          source.path.split("/").pop() ?? source.path;
                        const isSelected = selectedSourceIndex === index;
                        return (
                          <Tooltip key={`${source.path}-${index}`}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-7 px-2.5 text-xs shrink-0 gap-1.5 font-mono border transition-colors",
                                  isSelected
                                    ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                                    : "bg-muted/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted hover:border-border/50",
                                )}
                                onClick={() => {
                                  setSelectedSourceIndex(
                                    isSelected ? null : index,
                                  );
                                  Sentry.startSpan(
                                    {
                                      name: "Select Source File",
                                      op: "ui.click",
                                    },
                                    (span) => {
                                      span?.setAttribute(
                                        "source.path",
                                        source.path,
                                      );
                                      span?.setAttribute("source.index", index);
                                    },
                                  );
                                }}
                              >
                                <Code2 className="h-3 w-3" />
                                {name}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="font-mono text-xs">{source.path}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>

          {isPanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full flex flex-col bg-background border-l overflow-hidden">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50 shrink-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileCode2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">
                          {fileName}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {selectedSource?.path}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Navigation */}
                      <div className="flex items-center gap-0.5 mr-1 border-r pr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handlePrevious}
                          disabled={selectedSourceIndex === 0}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {(selectedSourceIndex ?? 0) + 1}/
                          {sourcesWithContent.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleNext}
                          disabled={
                            selectedSourceIndex ===
                            sourcesWithContent.length - 1
                          }
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleCopy}
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Copy code</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={selectedSource?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open file in GitHub"
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Open in GitHub
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleClose}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Close panel
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Language indicator */}
                  <div className="px-3 py-1 bg-muted/30 border-b shrink-0">
                    <span className="text-xs text-muted-foreground font-mono">
                      {language}
                    </span>
                  </div>

                  {/* Code Content - scrollable both directions */}
                  <div className="flex-1 min-h-0 min-w-0 relative">
                    <div className="absolute inset-0 overflow-auto">
                      {selectedSource?.content ? (
                        language === "md" || language === "mdx" ? (
                          <div className="max-w-none p-4 text-sm leading-relaxed text-foreground">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {selectedSource.content
                                .split("\n")
                                .filter(
                                  (line) => !line.trimStart().startsWith(":::"),
                                )
                                .join("\n")}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <CodeBlock
                            key={`${selectedSource.path}-${language}`}
                            data={[
                              {
                                language,
                                filename: fileName,
                                code: selectedSource.content,
                              },
                            ]}
                            defaultValue={language}
                            className="h-auto overflow-visible border-0 rounded-none"
                          >
                            <CodeBlockBody className="overflow-visible">
                              {(item) => (
                                <CodeBlockItem
                                  key={`${selectedSource.path}-${item.language}`}
                                  value={item.language}
                                >
                                  <CodeBlockContent
                                    language={item.language as BundledLanguage}
                                  >
                                    {item.code}
                                  </CodeBlockContent>
                                </CodeBlockItem>
                              )}
                            </CodeBlockBody>
                          </CodeBlock>
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p className="text-sm">No code content available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
