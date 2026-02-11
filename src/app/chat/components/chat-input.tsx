import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, Database, Lock, StopCircle } from "lucide-react";
import { ChatStatus } from "ai";

type ChatInputProps = {
  input: string;
  status: ChatStatus;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onStop: () => Promise<void>;
  disableChatInput: boolean;
  indexedRepos: { repoFullName: string }[];
  selectedIndexedRepo: string;
  onSelectedIndexedRepoChange: (value: string) => void;
  isDropdownDisabled: boolean;
};

export function ChatInput({
  input,
  status,
  onInputChange,
  onSubmit,
  onStop,
  disableChatInput,
  indexedRepos,
  selectedIndexedRepo,
  onSelectedIndexedRepoChange,
  isDropdownDisabled,
}: ChatInputProps) {
  const hasIndexedRepos = indexedRepos.length > 0;

  return (
    <div className="sticky bottom-0">
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 px-4 py-4 border-t border-border bg-card relative"
      >
        <Textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          className="bg-background text-foreground px-4 focus:outline-none focus:ring-2 focus:ring-ring min-h-20 rounded-2xl md:text-base pb-16"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              onSubmit(e);
            }
          }}
          disabled={disableChatInput}
        />
        {/* Bottom toolbar: repo selector (left) + send/stop button (right) */}
        <div className="absolute bottom-7 left-7 right-7 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto">
            {hasIndexedRepos &&
              (isDropdownDisabled && selectedIndexedRepo ? (
                <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <Database className="h-3 w-3" />
                  <span className="font-medium text-foreground max-w-40 truncate">
                    {selectedIndexedRepo}
                  </span>
                </div>
              ) : (
                <Select
                  value={selectedIndexedRepo || "__all__"}
                  onValueChange={(value) =>
                    onSelectedIndexedRepoChange(
                      value === "__all__" ? "" : value,
                    )
                  }
                  disabled={isDropdownDisabled}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-8 w-auto max-w-[220px] rounded-lg border-none bg-muted/60 shadow-none text-xs hover:bg-muted"
                  >
                    <Database className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Select repo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All repositories</SelectItem>
                    {indexedRepos.map((repo) => (
                      <SelectItem
                        key={repo.repoFullName}
                        value={repo.repoFullName}
                      >
                        {repo.repoFullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
          </div>
          <div className="pointer-events-auto">
            {status !== "streaming" ? (
              <Button
                type="submit"
                disabled={!input.trim()}
                className="bg-primary text-primary-foreground rounded-2xl h-10 w-10"
                aria-label="Send message"
              >
                <ArrowUp />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={async () => {
                  await onStop();
                }}
                className="bg-destructive text-destructive-foreground rounded-2xl h-10 w-10"
                aria-label="Stop generating message"
              >
                <StopCircle />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
