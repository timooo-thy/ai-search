import Link from "next/link";
import { getSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import RecentSearch from "./components/recent-search";
import {
  getRecentChatTitles,
  getUserStats,
} from "@/actions/ui-message-actions";
import UsageStatistic from "./components/usage-statistic";
import * as Sentry from "@sentry/nextjs";

export default async function Dashboard() {
  const user = await getSession();

  let recentChats: { id: string; title: string; updatedAt: Date }[] = [];
  let usageStats = null;

  try {
    [recentChats, usageStats] = await Promise.all([
      getRecentChatTitles(),
      getUserStats(),
    ]);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: "dashboard_data_fetch" },
      extra: { message: "Failed to fetch dashboard data" },
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar user={user} />

      {/* Hero Section */}
      <section className="pt-32 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8">
              <span className="text-sm font-medium">
                👋 Welcome back, {user.name?.split(" ")[0] || "Developer"}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your AI-Powered
              <span className="block text-primary">Development Hub</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Access your projects, explore codebases with AI, and accelerate
              your development workflow with intelligent code insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/chat"
                className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg"
              >
                Start AI Search
              </Link>
              <Link
                href="/settings"
                className="border border-border px-8 py-4 rounded-lg font-semibold text-lg hover:bg-muted transition-all"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Quick Actions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Jump into your most common development tasks and workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all group cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">🔍</span>
                </div>
                <CardTitle>AI Code Search</CardTitle>
                <CardDescription>
                  Search any codebase using natural language queries and get
                  intelligent insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/chat">
                  <Button className="w-full" variant="outline">
                    Start Searching
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all group cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">📁</span>
                </div>
                <CardTitle>My Projects</CardTitle>
                <CardDescription>
                  View and manage your connected repositories and development
                  projects.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="#">
                  <Button className="w-full" variant="outline">
                    View Projects
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all group cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle>Code Analytics</CardTitle>
                <CardDescription>
                  Analyze code patterns, dependencies, and get insights on your
                  development workflow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="#">
                  <Button className="w-full" variant="outline">
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all group cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">🕸️</span>
                </div>
                <CardTitle>Code Visualization</CardTitle>
                <CardDescription>
                  Generate interactive graphs showing code relationships and
                  architecture.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="#">
                  <Button className="w-full" variant="outline">
                    Create Graph
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all group cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">📖</span>
                </div>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Access guides, tutorials, and documentation for maximizing
                  your productivity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="#">
                  <Button className="w-full" variant="outline">
                    Read Docs
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all group cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">⚙️</span>
                </div>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Customize your experience, manage integrations, and configure
                  preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/settings">
                  <Button className="w-full" variant="outline">
                    Open Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Recent Activity
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay up to date with your latest searches, projects, and insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RecentSearch recentChats={recentChats} />
            <UsageStatistic usageStats={usageStats} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Explore Some Code?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Start your AI-powered code exploration journey and discover insights
            in any codebase.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/chat"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Searching
            </Link>
            <Link
              href="/"
              className="border border-border px-8 py-4 rounded-lg font-semibold text-lg hover:bg-muted transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  AI
                </span>
              </div>
              <span className="text-xl font-bold text-foreground">
                CodeOrient
              </span>
            </div>
            <div className="text-center text-muted-foreground">
              <p>&copy; 2025 CodeOrient AI. Built with ❤️ for developers.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
