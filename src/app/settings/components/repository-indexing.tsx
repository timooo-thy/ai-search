"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  FolderGit2,
  AlertCircle,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { searchGitHubRepos } from "@/actions/github-actions";
import { useDebounce } from "@/hooks/use-debounce";

const MAX_INDEXED_REPOS = 5;

type IndexedRepository = {
  id: string;
  repoFullName: string;
  repoUrl: string;
  branch: string;
  status:
    | "PENDING"
    | "CLONING"
    | "PARSING"
    | "INDEXING"
    | "COMPLETED"
    | "FAILED";
  progress: number;
  totalFiles: number;
  indexedFiles: number;
  errorMessage: string | null;
  lastIndexedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type UserRepo = {
  name: string;
  description: string | null;
  url: string;
};

type SearchResult = {
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  owner: { login: string; avatarUrl: string };
};

type RepositoryIndexingProps = {
  repositories: UserRepo[];
};

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-yellow-500", icon: Loader2 },
  CLONING: { label: "Cloning", color: "bg-blue-500", icon: Loader2 },
  PARSING: { label: "Parsing", color: "bg-blue-500", icon: Loader2 },
  INDEXING: { label: "Indexing", color: "bg-blue-500", icon: Loader2 },
  COMPLETED: { label: "Indexed", color: "bg-green-500", icon: CheckCircle2 },
  FAILED: { label: "Failed", color: "bg-red-500", icon: XCircle },
};

/**
 * Formats a star count for display (e.g. 1200 -> "1.2k").
 * @param count - The raw star count
 * @returns Formatted string
 */
function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return count.toString();
}

export function RepositoryIndexing({ repositories }: RepositoryIndexingProps) {
  const [indexedRepos, setIndexedRepos] = useState<IndexedRepository[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 400);

  // Computed values
  const activeCount = indexedRepos.filter(
    (r) => r.status !== "FAILED",
  ).length;
  const atLimit = activeCount >= MAX_INDEXED_REPOS;

  // User's own repos not already indexed (shown when search is empty)
  const availableUserRepos = repositories
    .map((repo) => {
      const fullName = repo.url.replace("https://github.com/", "");
      return { ...repo, fullName };
    })
    .filter(
      (repo) =>
        !indexedRepos.some(
          (indexed) =>
            indexed.repoFullName === repo.fullName &&
            indexed.status !== "FAILED",
        ),
    );

  // Fetch indexed repositories
  const fetchIndexedRepos = useCallback(async () => {
    try {
      const response = await fetch("/api/indexing");
      if (response.ok) {
        const data = await response.json();
        setIndexedRepos(data.repositories || []);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  }, []);

  useEffect(() => {
    fetchIndexedRepos();
  }, [fetchIndexedRepos]);

  // Poll for progress updates when there are active indexing jobs
  useEffect(() => {
    const hasActiveJobs = indexedRepos.some(
      (repo) =>
        repo.status === "PENDING" ||
        repo.status === "CLONING" ||
        repo.status === "PARSING" ||
        repo.status === "INDEXING",
    );

    if (hasActiveJobs) {
      const interval = setInterval(fetchIndexedRepos, 3000);
      return () => clearInterval(interval);
    }
  }, [indexedRepos, fetchIndexedRepos]);

  // Search GitHub repos when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const doSearch = async () => {
      setIsSearching(true);
      try {
        const results = await searchGitHubRepos(debouncedQuery);
        if (!cancelled) {
          setSearchResults(results);
        }
      } catch (error) {
        Sentry.captureException(error);
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    doSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleIndexRepo = async (repoFullName: string) => {
    setIsOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("Repository is already being indexed");
        } else if (response.status === 403) {
          toast.error(
            data.error || "Repository limit reached. Delete a repo to index a new one.",
          );
        } else {
          toast.error(data.error || "Failed to start indexing");
        }
        return;
      }

      toast.success("Indexing started! This may take a few minutes.");
      await fetchIndexedRepos();
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Failed to start indexing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchIndexedRepos();
    setIsRefreshing(false);
  };

  const handleDeleteRepo = async (repoFullName: string) => {
    try {
      const response = await fetch(
        `/api/indexing?repo=${encodeURIComponent(repoFullName)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("Repository index deleted");
      await fetchIndexedRepos();
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Failed to delete repository index");
    }
  };

  const handleReindex = async (repoFullName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName }),
      });

      if (!response.ok) {
        throw new Error("Failed to start reindexing");
      }

      toast.success("Reindexing started!");
      await fetchIndexedRepos();
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Failed to start reindexing");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine what to show in the dropdown
  const hasQuery = debouncedQuery.trim().length >= 2;
  const showSearchResults = hasQuery && searchResults.length > 0;
  const showUserRepos = !hasQuery && availableUserRepos.length > 0;
  const showEmpty =
    hasQuery && !isSearching && searchResults.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Repository Indexing</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold tracking-wider">
              {activeCount}/{MAX_INDEXED_REPOS} INDEXED
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
        <CardDescription>
          Search and index any public GitHub repository for faster semantic code
          search.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search input with combobox dropdown */}
        <Popover open={isOpen && !atLimit} onOpenChange={setIsOpen} modal={false}>
          <PopoverAnchor asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder={
                  atLimit
                    ? "LIMIT REACHED — Delete a repo to index"
                    : "Search repositories... (e.g. facebook/react)"
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => {
                  if (!atLimit) setIsOpen(true);
                }}
                disabled={atLimit || isLoading}
                className="pl-9 pr-9 border-2 border-border focus:border-primary"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </PopoverAnchor>
          <PopoverContent
            className="p-0 border-2 border-border"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{
              width: "var(--radix-popover-trigger-width)",
            }}
          >
            <Command shouldFilter={false}>
              <CommandList>
                {/* Search results */}
                {showSearchResults && (
                  <CommandGroup heading="SEARCH RESULTS">
                    {searchResults.map((repo) => {
                      const alreadyIndexed = indexedRepos.some(
                        (indexed) =>
                          indexed.repoFullName === repo.fullName &&
                          indexed.status !== "FAILED",
                      );
                      return (
                        <CommandItem
                          key={repo.fullName}
                          value={repo.fullName}
                          onSelect={() => handleIndexRepo(repo.fullName)}
                          disabled={alreadyIndexed}
                          className="cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={repo.owner.avatarUrl}
                            alt={repo.owner.login}
                            className="h-5 w-5 border border-border"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {repo.fullName}
                              </span>
                              {alreadyIndexed && (
                                <span className="text-xs text-muted-foreground">
                                  (indexed)
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {repo.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-primary" />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3" />
                              {formatStars(repo.stars)}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                {/* User's own repos when search is empty */}
                {showUserRepos && (
                  <CommandGroup heading="YOUR REPOS">
                    {availableUserRepos.map((repo) => (
                      <CommandItem
                        key={repo.fullName}
                        value={repo.fullName}
                        onSelect={() => handleIndexRepo(repo.fullName)}
                        className="cursor-pointer"
                      >
                        <FolderGit2 className="h-4 w-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm truncate">
                            {repo.fullName}
                          </span>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Loading state */}
                {isSearching && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                )}

                {/* Empty states */}
                {showEmpty && (
                  <CommandEmpty>
                    No repositories found for &quot;{debouncedQuery}&quot;
                  </CommandEmpty>
                )}

                {!hasQuery && availableUserRepos.length === 0 && (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Type to search any public GitHub repository
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Limit warning */}
        {atLimit && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-2 border-primary/30 text-xs font-bold text-primary tracking-wider">
            <AlertCircle className="h-3 w-3 shrink-0" />
            LIMIT REACHED — DELETE A REPO TO INDEX A NEW ONE
          </div>
        )}

        {/* Indexed repositories list */}
        {indexedRepos.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Indexed Repositories
            </h4>
            {indexedRepos.map((repo) => {
              const config = statusConfig[repo.status];
              const StatusIcon = config.icon;
              const isActive =
                repo.status === "CLONING" ||
                repo.status === "PARSING" ||
                repo.status === "INDEXING";

              return (
                <div
                  key={repo.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={repo.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm hover:underline truncate"
                      >
                        {repo.repoFullName}
                      </a>
                      <Badge
                        variant="secondary"
                        className={`${config.color} text-white text-xs`}
                      >
                        <StatusIcon
                          className={`h-3 w-3 mr-1 ${
                            isActive ? "animate-spin" : ""
                          }`}
                        />
                        {config.label}
                      </Badge>
                    </div>

                    {isActive && (
                      <div className="space-y-1">
                        <Progress value={repo.progress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">
                          {repo.indexedFiles} / {repo.totalFiles || "?"} files (
                          {repo.progress}%)
                        </p>
                      </div>
                    )}

                    {repo.status === "COMPLETED" && (
                      <p className="text-xs text-muted-foreground">
                        {repo.indexedFiles} files indexed
                        {repo.lastIndexedAt && (
                          <>
                            {" "}
                            &bull; Last indexed:{" "}
                            {new Date(repo.lastIndexedAt).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    )}

                    {repo.status === "FAILED" && repo.errorMessage && (
                      <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span className="truncate">{repo.errorMessage}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {(repo.status === "COMPLETED" ||
                      repo.status === "FAILED") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReindex(repo.repoFullName)}
                        disabled={isLoading}
                        title="Reindex"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          title="Delete index"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Repository Index
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the index for {repo.repoFullName}.
                            You&apos;ll need to reindex it to use semantic
                            search again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRepo(repo.repoFullName)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {indexedRepos.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No repositories indexed yet</p>
            <p className="text-xs mt-1">
              Search for a repository above to enable semantic code search
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
