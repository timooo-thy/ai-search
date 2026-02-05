import Link from "next/link";
import { getSession } from "@/hooks/use-session";
import { Navbar } from "@/components/navbar";
import RecentSearch from "./components/recent-search";
import {
  getRecentChatTitles,
  getUserStats,
} from "@/actions/ui-message-actions";
import UsageStatistic from "./components/usage-statistic";
import * as Sentry from "@sentry/nextjs";
import {
  Terminal,
  Search,
  Settings,
  GitBranch,
  MessageSquare,
  ArrowRight,
  Zap,
  Github,
} from "lucide-react";

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Global scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.015] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_4px)]" />

      {/* Animated grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--primary)_1px,transparent_1px)] bg-size-[60px_60px]" />
      </div>

      <Navbar user={user} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left: Welcome */}
            <div>
              {/* Status badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 mb-6">
                <div className="w-2 h-2 bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-primary tracking-wider">
                  WELCOME BACK
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                <span className="block text-muted-foreground text-xl sm:text-2xl mb-2">
                  HELLO,
                </span>
                <span className="block text-primary uppercase">
                  {user.name?.split(" ")[0] || "DEVELOPER"}
                </span>
              </h1>

              {/* Terminal-style status */}
              <div className="bg-card border-2 border-border p-4 font-mono max-w-md">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                  <Terminal className="w-3 h-3" />
                  <span>~/dashboard</span>
                </div>
                <p className="text-sm text-foreground">
                  <span className="text-primary">$</span> Your AI-powered
                  development hub is ready.
                </p>
              </div>
            </div>

            {/* Right: Quick CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/chat"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-bold text-sm overflow-hidden transition-all hover:scale-105"
              >
                <span className="relative z-10 flex items-center">
                  START SEARCHING
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-border text-foreground font-bold text-sm hover:border-primary hover:text-primary transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                SETTINGS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent" />

        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="text-xs font-bold text-primary tracking-widest mb-2">
                [ QUICK ACTIONS ]
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                JUMP INTO
              </h2>
            </div>
            <div className="hidden md:block text-6xl font-bold text-muted-foreground/20">
              01
            </div>
          </div>

          {/* Action grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Search - Primary */}
            <Link
              href="/chat"
              className="md:col-span-2 bg-primary text-primary-foreground p-8 group hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-primary-foreground/10 border-2 border-primary-foreground/30 flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI CODE SEARCH</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Search any codebase using natural language queries and get
                intelligent insights with inline citations.
              </p>
            </Link>

            {/* Code Visualisation */}
            <Link
              href="/chat"
              className="bg-card border-2 border-border p-8 group hover:border-primary transition-colors"
            >
              <div className="w-14 h-14 bg-accent/10 border-2 border-accent flex items-center justify-center mb-6">
                <GitBranch className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                CODE GRAPHS
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Generate interactive visualisations of code relationships.
              </p>
            </Link>

            {/* Chat History */}
            <Link
              href="/chat"
              className="bg-card border-2 border-border p-8 group hover:border-primary transition-colors"
            >
              <div className="w-14 h-14 bg-primary/10 border-2 border-primary flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                AI CHAT
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Continue your conversations with persistent history.
              </p>
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              className="bg-card border-2 border-border p-8 group hover:border-primary transition-colors"
            >
              <div className="w-14 h-14 bg-primary/10 border-2 border-primary flex items-center justify-center mb-6">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                SETTINGS
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Configure GitHub PAT and manage your preferences.
              </p>
            </Link>

            {/* Index Repos */}
            <Link
              href="/settings"
              className="bg-card border-2 border-border p-8 group hover:border-primary transition-colors"
            >
              <div className="w-14 h-14 bg-accent/10 border-2 border-accent flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                INDEX REPOS
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enable RAG-powered search for your repositories.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="text-xs font-bold text-primary tracking-widest mb-2">
                [ ACTIVITY ]
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                RECENT SESSIONS
              </h2>
            </div>
            <div className="hidden md:block text-6xl font-bold text-muted-foreground/20">
              02
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RecentSearch recentChats={recentChats} />
            <UsageStatistic usageStats={usageStats} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 mb-8">
            <span className="text-xs font-bold text-primary tracking-wider">
              READY TO EXPLORE?
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6">
            START YOUR
            <span className="block text-primary">CODE EXPLORATION</span>
          </h2>

          <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
            Discover insights in any codebase with AI-powered natural language
            search and interactive visualisations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="group relative inline-flex items-center justify-center px-10 py-5 bg-primary text-primary-foreground font-bold text-sm overflow-hidden transition-all hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                START SEARCHING
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-10 py-5 border-2 border-border text-foreground font-bold text-sm hover:border-primary hover:text-primary transition-colors"
            >
              LEARN MORE
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-primary bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <Terminal className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">CODE</span>
                <span className="text-sm font-bold text-primary">ORIENT</span>
              </div>
            </div>

            {/* GitHub link */}
            <Link
              href="https://github.com/timooo-thy/ai-search"
              className="inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>View on GitHub</span>
            </Link>

            {/* Status */}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t-2 border-border text-center text-xs text-muted-foreground">
            © 2026 CodeOrient. Built with precision for developers.
          </div>
        </div>
      </footer>
    </div>
  );
}
