"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";

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

export function RepositoryIndexing({ repositories }: RepositoryIndexingProps) {
  const [indexedRepos, setIndexedRepos] = useState<IndexedRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleStartIndexing = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository to index");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName: selectedRepo }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("Repository is already being indexed");
        } else {
          toast.error(data.error || "Failed to start indexing");
        }
        return;
      }

      toast.success("Indexing started! This may take a few minutes.");
      setSelectedRepo("");
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

  // Get repos that aren't already indexed
  const availableRepos = repositories.filter((repo) => {
    const repoFullName = repo.url.replace("https://github.com/", "");
    return !indexedRepos.some(
      (indexed) =>
        indexed.repoFullName === repoFullName && indexed.status !== "FAILED",
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Repository Indexing</CardTitle>
          </div>
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
        <CardDescription>
          Index your repositories for faster and more accurate code exploration.
          Indexed repos use semantic search instead of GitHub&apos;s API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new repository */}
        <div className="flex gap-2">
          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a repository to index" />
            </SelectTrigger>
            <SelectContent>
              {availableRepos.length === 0 ? (
                <SelectItem value="none" disabled>
                  {repositories.length === 0
                    ? "No repositories found. Add a GitHub PAT first."
                    : "All repositories are indexed"}
                </SelectItem>
              ) : (
                availableRepos.map((repo) => (
                  <SelectItem
                    key={repo.name}
                    value={repo.url.replace("https://github.com/", "")}
                  >
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="h-4 w-4" />
                      <span>{repo.name}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={handleStartIndexing}
            disabled={!selectedRepo || isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Index"}
          </Button>
        </div>

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
                            • Last indexed:{" "}
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
              Index a repository to enable faster semantic code search
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
