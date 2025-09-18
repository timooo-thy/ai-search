import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessagesSquareIcon } from "lucide-react";
import { ChatStatus } from "ai";

interface ChatInputProps {
  input: string;
  status: ChatStatus;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ChatInput({
  input,
  status,
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-end gap-2 px-4 py-4 border-t border-border bg-card"
    >
      <Textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 resize-none bg-background text-foreground border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
        rows={1}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            onSubmit(e);
          }
        }}
        disabled={status !== "ready"}
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                type="submit"
                disabled={
                  status === "streaming" ||
                  status === "submitted" ||
                  !input.trim()
                }
                className="bg-primary text-primary-foreground"
              >
                <MessagesSquareIcon />
                Send
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Send message</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </form>
  );
}
