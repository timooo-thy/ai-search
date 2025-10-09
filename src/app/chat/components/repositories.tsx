"use client";

import { MyDataPart } from "@/types/ui-message-type";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, GitBranch, Lock, Unlock } from "lucide-react";

type RepositoriesProps = {
  repositories: MyDataPart["repositories"];
  setSelectedRepo: React.Dispatch<React.SetStateAction<string>>;
  selectedRepo: string;
  onSubmit: (message: string) => Promise<void>;
};
/**
 * Render a card interface to browse, select, and confirm a repository from the provided data.
 *
 * Displays loading, empty, and list states for repositories; allows selecting a repository (unless loading),
 * opening a repository URL in a new tab, and confirming the current selection.
 *
 * @param repositories - Object containing repository details and a loading flag; controls list content and loading UI
 * @param selectedRepo - Name of the currently selected repository
 * @param setSelectedRepo - State setter to update the selected repository name
 * @param onSubmit - Callback invoked with a message when the user confirms the selection
 * @returns A React element that renders the repository selector card
 */
export default function Repositories({
  repositories,
  selectedRepo,
  setSelectedRepo,
  onSubmit,
}: RepositoriesProps) {
  const { details, loading } = repositories;

  const handleRepoToggle = (repoKey: string) => {
    if (loading) return;

    setSelectedRepo((prev) => (prev === repoKey ? "" : repoKey));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            <CardTitle>Repositories</CardTitle>
            {loading ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Unlock className="h-4 w-4 text-green-600" />
            )}
          </div>
          <Badge variant={loading ? "secondary" : "default"}>
            {loading ? "Loading..." : `${details.length} repos`}
          </Badge>
        </div>
        <CardDescription>
          {loading
            ? "Fetching repositories..."
            : "Select repository to work with"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                {index < 2 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[300px] w-full pr-4">
            {details.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <div className="text-center">
                  <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No repositories found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {details.map((repo, index) => (
                  <div key={repo.url}>
                    <div
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted/50 ${
                        selectedRepo === repo.url
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleRepoToggle(repo.url)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {repo.name}
                            </h4>
                            {selectedRepo === repo.url && (
                              <Badge variant="default" className="text-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {repo.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              repo.url,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {index < details.length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {loading
            ? "Please wait..."
            : selectedRepo && `${selectedRepo.split("/").pop()} selected`}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() =>
              onSubmit(`This is my selected repository: ${selectedRepo}`)
            }
            disabled={loading || !selectedRepo}
            size="sm"
          >
            Confirm Selection
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
