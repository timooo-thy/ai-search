import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp, StopCircle } from "lucide-react";
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
        <div className="absolute bottom-7 right-7">
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
      </form>
    </div>
  );
}
