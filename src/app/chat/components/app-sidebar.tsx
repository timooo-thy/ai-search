"use client";

import {
  ChevronUp,
  MoreHorizontal,
  Terminal,
  User,
  Settings,
  Plus,
  Trash2,
  Bookmark,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Session } from "@/lib/auth-client";
import SignOutButton from "./signout-button";
import {
  createChat,
  getUserChatTitles,
  deleteChat,
  getBookmarkedChats,
} from "@/actions/ui-message-actions";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";

type AppSidebarProps = {
  user: Session["user"];
};

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();
  const currentConversationId = useParams<{ id?: string }>().id;

  const navigationItems = [
    {
      title: "New Chat",
      icon: Plus,
      action: async () => {
        try {
          const chat = await createChat("New Chat");
          setRecentConversationTitles((prev) => [
            ...prev,
            { id: chat.id, title: chat.title },
          ]);
          router.push(`/chat/${chat.id}`);
        } catch (error) {
          Sentry.captureException(error, {
            tags: { context: "create_new_chat_failure" },
          });
          toast.error("Failed to create new chat. Please try again.");

          const chats = await getUserChatTitles();
          setRecentConversationTitles(
            chats.map((c) => ({
              id: c.id,
              title: c.title,
            })),
          );
        }
      },
    },
  ];

  const [recentConversationTitles, setRecentConversationTitles] = useState<
    {
      id: string;
      title: string;
    }[]
  >([]);

  const [bookmarkedChats, setBookmarkedChats] = useState<
    {
      id: string;
      title: string;
    }[]
  >([]);

  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);

  const handleDeleteChat = async (chatId: string) => {
    try {
      setRecentConversationTitles((prev) =>
        prev.filter((chat) => chat.id !== chatId),
      );
      // Also remove from bookmarked chats if present
      setBookmarkedChats((prev) => prev.filter((chat) => chat.id !== chatId));
      await deleteChat(chatId);

      // Redirect to chat page without ID if the current chat was deleted
      if (currentConversationId === chatId) {
        router.push("/chat");
      }
      toast.success("Chat deleted successfully");
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: "delete_chat_failure" },
      });
      toast.error("Failed to delete chat. Please try again.");
      const chats = await getUserChatTitles();
      setRecentConversationTitles(
        chats.map((c) => ({
          id: c.id,
          title: c.title,
        })),
      );
      // Refresh bookmarks on error
      refreshBookmarks();
    }
    setConversationToDelete(null);
  };

  // Function to refresh bookmarked chats
  const refreshBookmarks = async () => {
    const bookmarked = await getBookmarkedChats();
    setBookmarkedChats(
      bookmarked.map((c) => ({
        id: c.id,
        title: c.title,
      })),
    );
  };

  useEffect(() => {
    const handleTitleUpdate = (e: Event) => {
      const { chatId, title } = (e as CustomEvent).detail;
      setRecentConversationTitles((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title } : c)),
      );
    };
    window.addEventListener("chatTitleUpdated", handleTitleUpdate);
    return () =>
      window.removeEventListener("chatTitleUpdated", handleTitleUpdate);
  }, []);

  useEffect(() => {
    async function fetchChats() {
      const [chats, bookmarked] = await Promise.all([
        getUserChatTitles(),
        getBookmarkedChats(),
      ]);
      setRecentConversationTitles(
        chats.map((c) => ({
          id: c.id,
          title: c.title,
        })),
      );
      setBookmarkedChats(
        bookmarked.map((c) => ({
          id: c.id,
          title: c.title,
        })),
      );
    }

    fetchChats();
  }, [user.id]);

  // Listen for bookmark changes from ChatHeader
  useEffect(() => {
    const handleBookmarkChange = () => {
      refreshBookmarks();
    };

    window.addEventListener("bookmark-changed", handleBookmarkChange);
    return () => {
      window.removeEventListener("bookmark-changed", handleBookmarkChange);
    };
  }, []);

  return (
    <Sidebar variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="relative flex aspect-square size-8 items-center justify-center bg-primary text-primary-foreground">
                  <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-primary" />
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-primary" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-primary" />
                  <Terminal className="size-4" />
                </div>
                <div className="grid flex-1 text-left">
                  <span className="truncate font-bold tracking-wider">
                    CODEORIENT
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Button onClick={item.action}>
                      {<item.icon className="size-4" />}
                      <span>{item.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Bookmark className="size-3 mr-1" />
            Bookmarked
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bookmarkedChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <div className="flex items-center gap-1 w-full">
                    <SidebarMenuButton asChild className="flex-1">
                      <Button
                        variant={
                          chat.id === currentConversationId
                            ? "outline"
                            : "ghost"
                        }
                        className="bg-secondary-foreground justify-start"
                        onClick={() => {
                          router.push(`/chat/${chat.id}`);
                        }}
                      >
                        <Bookmark className="h-3 w-3 mr-1 fill-primary text-primary" />
                        <span className="truncate text-sm text-left">
                          {chat.title}
                        </span>
                      </Button>
                    </SidebarMenuButton>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentConversationTitles.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <div className="flex items-center gap-1 w-full">
                    <SidebarMenuButton asChild className="flex-1">
                      <Button
                        variant={
                          chat.id === currentConversationId
                            ? "outline"
                            : "ghost"
                        }
                        className="bg-secondary-foreground justify-start"
                        onClick={() => {
                          router.push(`/chat/${chat.id}`);
                        }}
                      >
                        <span className="truncate text-sm text-left">
                          {chat.title}
                        </span>
                      </Button>
                    </SidebarMenuButton>
                    <AlertDialog
                      open={conversationToDelete === chat.id}
                      onOpenChange={(open) => {
                        if (!open) setConversationToDelete(null);
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-secondary-foreground hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setConversationToDelete(chat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{chat.title}
                            &quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteChat(chat.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.image ?? undefined}
                      alt="User Avatar"
                    />
                    <AvatarFallback className="rounded-lg text-primary">
                      {user?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem
                  onSelect={() => {
                    router.push("/dashboard");
                  }}
                  className="w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
