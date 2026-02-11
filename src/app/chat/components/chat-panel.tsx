"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { MyUIMessage } from "@/types/ui-message-type";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { ChatHeader } from "./chat-header";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { updateChatTitle } from "@/actions/ui-message-actions";
import * as Sentry from "@sentry/nextjs";

type ChatPanelProps = {
  chatId: string;
  previousMessages: MyUIMessage[];
  hasValidGithubPAT: boolean;
  userName: string;
  userProfilePicture?: string;
  initialSelectedRepo: string | null;
  indexedRepos: { repoFullName: string }[];
};

/**
 * Render the chat panel for a conversation, handling message input, sending, and repository selection UI.
 *
 * Initialises the chat session using the provided chat ID, populates messages with `previousMessages`, processes an optional initial query from the URL (sending it once when ready), auto-scrolls to new messages, and displays header, message list, and input controls.
 *
 * @param chatId - The identifier for the chat session used to initialize routing and the chat transport
 * @param previousMessages - Initial messages to populate the chat view
 * @param hasValidGithubPAT - Flag indicating if the user has a valid GitHub Personal Access Token
 * @param userName - The name of the user
 * @param userProfilePicture - Optional URL of the user's profile picture
 * @param initialSelectedRepo - The repo pre-selected for this chat (from DB), or null
 * @param indexedRepos - The user's completed indexed repositories for the dropdown
 * @returns The chat panel element containing the header, messages list, and input controls
 */
export default function ChatPanel({
  chatId,
  previousMessages,
  hasValidGithubPAT,
  userName,
  userProfilePicture,
  initialSelectedRepo,
  indexedRepos,
}: ChatPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const hasProcessedInitialQueryRef = useRef(false);

  const [input, setInput] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [selectedIndexedRepo, setSelectedIndexedRepo] = useState<string>(
    initialSelectedRepo || "",
  );
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasTitleBeenUpdatedRef = useRef(previousMessages.length > 0);

  // The dropdown is locked once the chat already had a persisted repo or messages have been sent
  const isRepoLocked =
    initialSelectedRepo !== null || previousMessages.length > 0;

  // Use a ref so the transport closure always reads the latest value
  const selectedIndexedRepoRef = useRef(selectedIndexedRepo);
  selectedIndexedRepoRef.current = selectedIndexedRepo;

  // Track whether the selected repo has already been persisted to avoid sending it on every request
  const hasPersistedRepoRef = useRef(initialSelectedRepo !== null);

  const { messages, sendMessage, status, stop } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }
    },
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        // Only include selectedRepo when it hasn't been persisted yet
        const shouldSendRepo =
          !hasPersistedRepoRef.current && !!selectedIndexedRepoRef.current;
        if (shouldSendRepo) {
          hasPersistedRepoRef.current = true;
        }

        return {
          body: {
            message: messages[messages.length - 1],
            id,
            selectedRepo: shouldSendRepo
              ? selectedIndexedRepoRef.current
              : undefined,
          },
        };
      },
    }),
    onError: (error) => {
      toast.error(
        error?.message || "An error occurred. Please try again later.",
      );
    },
    messages: previousMessages,
  });

  const sendText = useCallback(
    (text: string) =>
      sendMessage({
        text,
        metadata: {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        },
      }),
    [sendMessage],
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      const messageText = input.trim();
      sendText(messageText);
      setInput("");

      if (!hasTitleBeenUpdatedRef.current) {
        hasTitleBeenUpdatedRef.current = true;
        const title =
          messageText.length > 80
            ? messageText.slice(0, 80) + "…"
            : messageText;
        updateChatTitle(chatId, title)
          .then(() => {
            window.dispatchEvent(
              new CustomEvent("chatTitleUpdated", {
                detail: { chatId, title },
              }),
            );
          })
          .catch((error) => {
            Sentry.captureException(error, {
              tags: { context: "update_chat_title_failure" },
            });
          });
      }
    }
  };

  const handleUISend = async (message: string) => {
    sendText(message);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  useEffect(() => {
    if (
      initialQuery &&
      sendText &&
      !hasProcessedInitialQueryRef.current &&
      status === "ready"
    ) {
      hasProcessedInitialQueryRef.current = true;

      sendText(initialQuery);

      router.replace(`/chat/${chatId}`);
    }
  }, [initialQuery, status, chatId, router, sendText]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // After the first user message is sent in this session, the dropdown locks
  const hasUserSentMessage = messages.length > previousMessages.length;
  const isDropdownDisabled = isRepoLocked || hasUserSentMessage;

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <ChatMessages
        hasValidGithubPAT={hasValidGithubPAT}
        messages={messages}
        status={status}
        chatEndRef={chatEndRef}
        selectedRepo={selectedRepo}
        setSelectedRepo={setSelectedRepo}
        onSubmit={handleUISend}
        userName={userName}
        userProfilePicture={userProfilePicture}
      />
      <ChatInput
        input={input}
        status={status}
        onInputChange={handleInputChange}
        onSubmit={handleSend}
        onStop={stop}
        disableChatInput={status !== "ready" || !hasValidGithubPAT}
        indexedRepos={indexedRepos}
        selectedIndexedRepo={selectedIndexedRepo}
        onSelectedIndexedRepoChange={setSelectedIndexedRepo}
        isDropdownDisabled={isDropdownDisabled}
      />
    </div>
  );
}
