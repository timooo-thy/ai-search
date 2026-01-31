"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, ShareIcon, Check, Copy, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import {
  toggleBookmark,
  toggleShare,
  getChatBookmarkStatus,
  getChatShareStatus,
} from "@/actions/ui-message-actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChatHeaderProps = {
  isReadOnly?: boolean;
  chatTitle?: string;
  ownerName?: string;
};

export function ChatHeader({
  isReadOnly,
  chatTitle,
  ownerName,
}: ChatHeaderProps) {
  const params = useParams<{ id?: string }>();
  const chatId = params?.id;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (chatId && !isReadOnly) {
      // Fetch initial bookmark and share status
      getChatBookmarkStatus(chatId)
        .then(setIsBookmarked)
        .catch(() => {});
      getChatShareStatus(chatId)
        .then(({ isShared, shareToken }) => {
          setIsShared(isShared);
          setShareToken(shareToken);
        })
        .catch(() => {});
    }
  }, [chatId, isReadOnly]);

  const handleBookmarkToggle = async () => {
    if (!chatId) return;

    Sentry.startSpan(
      {
        name: "bookmark.toggle",
        op: "ui.action.click",
        attributes: {
          chatId,
          isBookmarked: !isBookmarked,
        },
      },
      async () => {
        try {
          const newStatus = await toggleBookmark(chatId);
          setIsBookmarked(newStatus);
          // Notify sidebar to refresh bookmarks
          window.dispatchEvent(new CustomEvent("bookmark-changed"));
          toast.success(newStatus ? "Chat bookmarked" : "Bookmark removed");
        } catch (error) {
          Sentry.captureException(error);
          toast.error("Failed to update bookmark");
        }
      },
    );
  };

  const handleShareToggle = async () => {
    if (!chatId) return;

    Sentry.startSpan(
      {
        name: "share.toggle",
        op: "ui.action.click",
        attributes: {
          chatId,
          isShared: !isShared,
        },
      },
      async () => {
        try {
          const result = await toggleShare(chatId);
          setIsShared(result.isShared);
          setShareToken(result.shareToken);
          toast.success(
            result.isShared ? "Chat is now shareable" : "Chat sharing disabled",
          );
        } catch (error) {
          Sentry.captureException(error);
          toast.error("Failed to update sharing settings");
        }
      },
    );
  };

  const shareUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/chat/shared/${shareToken}`
    : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    Sentry.startSpan(
      {
        name: "share.copy",
        op: "ui.action.click",
        attributes: { chatId, hasShareUrl: true },
      },
      async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast.success("Link copied to clipboard");
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          Sentry.captureException(error);
          toast.error("Failed to copy link");
        }
      },
    );
  };

  // Read-only header for shared chats
  if (isReadOnly) {
    return (
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b bg-card text-card-foreground">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{chatTitle}</span>
          <span className="text-xs text-muted-foreground">
            shared by {ownerName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b bg-card text-card-foreground">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="hover:bg-accent/50" />
      </div>
      <div className="flex items-center gap-2">
        {chatId && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmarkToggle}
              className="hover:bg-accent/50"
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark chat"}
            >
              <BookmarkIcon
                className={cn(
                  "h-4 w-4 transition-all",
                  isBookmarked && "fill-primary text-primary",
                )}
              />
            </Button>
            <Dialog
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-accent/50"
                  aria-label="Share chat"
                >
                  <ShareIcon
                    className={cn(
                      "h-4 w-4 transition-all",
                      isShared && "text-primary",
                    )}
                  />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Chat</DialogTitle>
                  <DialogDescription>
                    {isShared
                      ? "Anyone with this link can view this chat."
                      : "Enable sharing to generate a public link for this chat."}
                  </DialogDescription>
                </DialogHeader>
                {isShared && shareToken ? (
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <Label htmlFor="link" className="sr-only">
                        Link
                      </Label>
                      <Input
                        id="link"
                        value={shareUrl}
                        readOnly
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="px-3"
                      onClick={handleCopyLink}
                      aria-label="Copy shareable link"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : null}
                <DialogFooter className="sm:justify-between">
                  <Button
                    type="button"
                    variant={isShared ? "destructive" : "default"}
                    onClick={handleShareToggle}
                  >
                    {isShared ? (
                      <>
                        <Link2Off className="mr-2 h-4 w-4" />
                        Disable Sharing
                      </>
                    ) : (
                      <>
                        <ShareIcon className="mr-2 h-4 w-4" />
                        Enable Sharing
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
        <ModeToggle />
      </div>
    </div>
  );
}
