import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessagesSquareIcon, StopCircle } from "lucide-react";
import { ChatStatus } from "ai";

interface ChatInputProps {
  input: string;
  status: ChatStatus;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onStop: () => Promise<void>;
  disableChatInput: boolean;
}

export function ChatInput({
  input,
  status,
  onInputChange,
  onSubmit,
  onStop,
  disableChatInput,
}: ChatInputProps) {
  return (
    <div className="sticky bottom-0">
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 px-4 py-4 border-t border-border bg-card"
      >
        <Textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          className="bg-background text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              onSubmit(e);
            }
          }}
          disabled={disableChatInput}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                {status !== "streaming" ? (
                  <Button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-primary text-primary-foreground"
                  >
                    <MessagesSquareIcon />
                    Send
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={async () => {
                      await onStop();
                    }}
                    className="bg-destructive text-destructive-foreground"
                  >
                    <StopCircle />
                    Stop
                  </Button>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </form>
    </div>
  );
}
