"use client";

import {
  ChevronUp,
  MoreHorizontal,
  ActivityIcon,
  User,
  Settings,
  Plus,
  Trash2,
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
} from "@/actions/ui-message-actions";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type AppSidebarProps = {
  user: Session["user"];
};

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();
  const currentConversationId = useParams<{ id: string }>().id;

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
          console.error("Error creating new chat:", error);
          toast.error("Failed to create new chat. Please try again.");

          const chats = await getUserChatTitles();
          setRecentConversationTitles(
            chats.map((c) => ({
              id: c.id,
              title: c.title,
            }))
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

  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);

  const handleDeleteChat = async (chatId: string) => {
    try {
      setRecentConversationTitles((prev) =>
        prev.filter((chat) => chat.id !== chatId)
      );
      await deleteChat(chatId);

      // Redirect to chat page without ID if the current chat was deleted
      if (currentConversationId === chatId) {
        router.push("/chat");
      }
      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat. Please try again.");
      const chats = await getUserChatTitles();
      setRecentConversationTitles(
        chats.map((c) => ({
          id: c.id,
          title: c.title,
        }))
      );
    }
    setConversationToDelete(null);
  };

  useEffect(() => {
    async function fetchChats() {
      const chats = await getUserChatTitles();
      setRecentConversationTitles(
        chats.map((c) => ({
          id: c.id,
          title: c.title,
        }))
      );
    }

    fetchChats();
  }, [user.id]);

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ActivityIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">CodeOrient</span>
                  <span className="truncate text-xs">AI Assistant</span>
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
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentConversationTitles.map((chat, index) => (
                <SidebarMenuItem key={index}>
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
                    <AvatarImage src={`${user?.image}`} alt="User Avatar" />
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
                  onClick={async () => {
                    router.push("/dashboard");
                  }}
                  className="w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
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
