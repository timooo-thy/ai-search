"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Github,
  Shield,
  Bell,
  Palette,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  deleteUserGithubPAT,
  saveUserSettings,
} from "@/actions/ui-message-actions";
import { toast } from "sonner";
import { GitHubPATHelp } from "./github-pat-help";
import { validateGitHubPAT } from "@/actions/github-actions";
import { RepositoryIndexing } from "./repository-indexing";
import * as Sentry from "@sentry/nextjs";

type SettingsState = {
  githubPAT: string;
  hasGithubPAT: boolean;
  notifications: {
    email: boolean;
    desktop: boolean;
    searchResults: boolean;
  };
  preferences: {
    theme: string;
    searchResultsPerPage: string;
    defaultSearchMode: string;
    autoSave: boolean;
  };
  profile: {
    name: string;
    email: string;
    bio: string;
  };
};

type SettingsFormProps = {
  user: {
    name: string;
    email: string;
    bio: string;
    githubPAT: string | null;
  };
  validGithubPAT: boolean;
  repositories?: { name: string; description: string | null; url: string }[];
};

export function SettingsForm({ user, validGithubPAT, repositories = [] }: SettingsFormProps) {
  const [showPAT, setShowPAT] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    githubPAT: user.githubPAT ?? "",
    hasGithubPAT: validGithubPAT,
    notifications: {
      email: true,
      desktop: false,
      searchResults: true,
    },
    preferences: {
      theme: "system",
      searchResultsPerPage: "30",
      defaultSearchMode: "intelligent",
      autoSave: true,
    },
    profile: {
      name: user.name || "",
      email: user.email || "",
      bio: user.bio || "",
    },
  });

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const patToSave = settings.githubPAT.trim() || undefined;

      if (patToSave) {
        const isValid = await validateGitHubPAT(patToSave);
        if (!isValid) {
          toast.error(
            "GitHub token appears invalid or expired. Please check scopes or rotate."
          );
          return;
        }
      }

      await saveUserSettings(
        patToSave,
        settings.profile.name,
        settings.profile.bio
      );

      setSettings((prev) => ({ ...prev, hasGithubPAT: !!patToSave }));

      toast.success("Settings saved successfully.");
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: "settings_save" },
      });
      toast.error("Failed to save user settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGithubPAT = async () => {
    setIsLoading(true);
    setShowDeleteDialog(false);
    try {
      await deleteUserGithubPAT();
      setSettings((prev) => ({
        ...prev,
        githubPAT: "",
        hasGithubPAT: false,
      }));
      toast.success("GitHub token removed successfully.");
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: "github_pat_delete" },
      });
      toast.error("Failed to remove GitHub token. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    section: keyof SettingsState,
    field: string,
    value: string | boolean
  ) => {
    setSettings((prev) => {
      if (section === "githubPAT") {
        return {
          ...prev,
          githubPAT: value as string,
        };
      }

      return {
        ...prev,
        [section]: {
          ...(prev[section] as object),
          [field]: value,
        },
      };
    });
  };

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Settings
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Customise your experience and manage your integrations
          </p>
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-full">
            <TabsTrigger
              value="integrations"
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center gap-2"
            >
              <Palette className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Integration
                </CardTitle>
                <CardDescription>
                  Connect your GitHub account to enable repository analysis and
                  code search
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-pat">
                    GitHub Personal Access Token
                  </Label>
                  <div className="relative">
                    <Input
                      id="github-pat"
                      type={showPAT ? "text" : "password"}
                      placeholder={"github_pat_xxxxxxxxxxxxxxxxxxxx"}
                      value={settings.githubPAT}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          githubPAT: e.target.value,
                        }))
                      }
                      className="pr-10"
                      autoComplete="new-password"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPAT(!showPAT)}
                    >
                      {showPAT ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Required scopes: <Badge variant="secondary">repo</Badge>{" "}
                      <Badge variant="secondary">read:org</Badge>
                    </p>
                    <GitHubPATHelp />
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your token is encrypted and stored securely. We only use it
                    to access repositories you have permission to view.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between items-center pt-4">
                  <div>
                    <p className="font-medium">Connection Status</p>
                    <p className="text-sm text-muted-foreground">
                      {settings.hasGithubPAT ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={settings.hasGithubPAT ? "default" : "secondary"}
                    >
                      {settings.hasGithubPAT ? "Active" : "Inactive"}
                    </Badge>
                    {settings.hasGithubPAT && (
                      <AlertDialog
                        open={showDeleteDialog}
                        onOpenChange={setShowDeleteDialog}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className=" hover:bg-red-50"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove GitHub Token
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove your GitHub
                              Personal Access Token? This will disable GitHub
                              integration features until you add a new token.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteGithubPAT}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={isLoading}
                            >
                              {isLoading ? "Removing..." : "Remove Token"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Repository Indexing - only show when GitHub PAT is connected */}
            {settings.hasGithubPAT && (
              <RepositoryIndexing repositories={repositories} />
            )}
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Preferences</CardTitle>
                <CardDescription>
                  Customize how search results are displayed and processed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="results-per-page">Results per page</Label>
                    <Select
                      value={settings.preferences.searchResultsPerPage}
                      onValueChange={(value) =>
                        handleInputChange(
                          "preferences",
                          "searchResultsPerPage",
                          value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select results per page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 results</SelectItem>
                        <SelectItem value="20">20 results</SelectItem>
                        <SelectItem value="30">30 results</SelectItem>
                        <SelectItem value="50">50 results</SelectItem>
                        <SelectItem value="100">100 results</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="search-mode">Default search mode</Label>
                    <Select
                      value={settings.preferences.defaultSearchMode}
                      onValueChange={(value) =>
                        handleInputChange(
                          "preferences",
                          "defaultSearchMode",
                          value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select search mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intelligent">Intelligent</SelectItem>
                        <SelectItem value="exact">Exact match</SelectItem>
                        <SelectItem value="fuzzy">Fuzzy search</SelectItem>
                        <SelectItem value="semantic">
                          Semantic search
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-save search history</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically save your search queries for future
                        reference
                      </p>
                    </div>
                    <Switch
                      checked={settings.preferences.autoSave}
                      onCheckedChange={(checked) =>
                        handleInputChange("preferences", "autoSave", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your searches and account via
                        email
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) =>
                        handleInputChange("notifications", "email", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Desktop notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show browser notifications for important updates
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.desktop}
                      onCheckedChange={(checked) =>
                        handleInputChange("notifications", "desktop", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Search result notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when search analysis is complete
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.searchResults}
                      onCheckedChange={(checked) =>
                        handleInputChange(
                          "notifications",
                          "searchResults",
                          checked
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={settings.profile.name}
                      onChange={(e) =>
                        handleInputChange("profile", "name", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      disabled
                      value={settings.profile.email}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us a bit about yourself..."
                    className="min-h-[100px]"
                    value={settings.profile.bio}
                    onChange={(e) =>
                      handleInputChange("profile", "bio", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary text-primary-foreground px-8 py-2 hover:bg-primary/90 transition-all"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
