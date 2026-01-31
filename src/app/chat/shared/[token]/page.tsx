import { loadSharedChat } from "@/actions/ui-message-actions";
import { notFound } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import SharedChatPanel from "@/app/chat/components/shared-chat-panel";

export default async function SharedChatPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;

  try {
    const { chatTitle, ownerName, messages } = await loadSharedChat(token);

    return (
      <div className="flex flex-col h-screen w-full">
        <SharedChatPanel
          chatTitle={chatTitle}
          ownerName={ownerName}
          messages={messages}
        />
      </div>
    );
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        shareToken: token,
        message: "Error loading shared chat",
      },
    });
    notFound();
  }
}
