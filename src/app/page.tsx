import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  Terminal,
  GitBranch,
  Search,
  MessageSquare,
  Bookmark,
  Share2,
  Zap,
  Database,
  Eye,
  ArrowRight,
  ChevronRight,
  Github,
  Clock,
  Users,
  Code2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Global scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.015] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_4px)]" />

      {/* Animated grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--primary)_1px,transparent_1px)] bg-size-[60px_60px]" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative">
        {/* Floating decorative elements */}
        <div className="absolute top-40 left-10 w-32 h-32 border-2 border-primary/20 rotate-12 hidden lg:block" />
        <div className="absolute top-60 right-20 w-24 h-24 border-2 border-accent/30 -rotate-6 hidden lg:block" />
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-primary/5 hidden lg:block" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text content */}
            <div className="relative">
              {/* Status badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 mb-8">
                <div className="w-2 h-2 bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-primary tracking-wider">
                  SYSTEM ONLINE
                </span>
              </div>

              {/* Main headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                <span className="block">NAVIGATE</span>
                <span className="block text-primary">ANY CODEBASE</span>
                <span className="block text-muted-foreground text-2xl sm:text-3xl lg:text-4xl mt-2">
                  WITH AI PRECISION
                </span>
              </h1>

              {/* Terminal-style description */}
              <div className="bg-card border-2 border-border p-4 mb-8 font-mono">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                  <Terminal className="w-3 h-3" />
                  <span>~/codeorient</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="text-primary">$</span> Reduce
                  time-to-first-commit with natural language search, interactive
                  code graphs, and RAG-powered repository indexing.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/chat"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-bold text-sm overflow-hidden transition-all hover:scale-105"
                >
                  <span className="relative z-10 flex items-center">
                    START EXPLORING
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-border text-foreground font-bold text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  VIEW DEMO
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-8 mt-10 pt-8 border-t-2 border-border">
                <div>
                  <div className="text-2xl font-bold text-primary">RAG</div>
                  <div className="text-xs text-muted-foreground">INDEXED</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="text-2xl font-bold text-foreground">10+</div>
                  <div className="text-xs text-muted-foreground">LANGUAGES</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="text-2xl font-bold text-foreground">∞</div>
                  <div className="text-xs text-muted-foreground">REPOS</div>
                </div>
              </div>
            </div>

            {/* Right: Interactive terminal mockup */}
            <div className="relative">
              <div className="bg-card border-4 border-primary shadow-2xl shadow-primary/10">
                {/* Terminal header */}
                <div className="bg-primary px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary-foreground/30" />
                    <div className="w-3 h-3 bg-primary-foreground/50" />
                    <div className="w-3 h-3 bg-primary-foreground" />
                  </div>
                  <span className="text-xs font-bold text-primary-foreground tracking-wider">
                    CODEORIENT.AI
                  </span>
                  <div className="w-16" />
                </div>

                {/* Terminal content */}
                <div className="p-6 space-y-4 font-mono text-sm">
                  {/* Query input */}
                  <div className="flex items-start space-x-2">
                    <span className="text-primary font-bold">{">"}</span>
                    <span className="text-foreground">
                      How does authentication work in vercel/next.js?
                    </span>
                    <span className="w-2 h-4 bg-primary animate-pulse" />
                  </div>

                  {/* Processing indicator */}
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Zap className="w-3 h-3 text-accent" />
                    <span className="text-xs">Searching repository...</span>
                  </div>

                  {/* Results */}
                  <div className="border-2 border-border p-4 space-y-3">
                    <div className="text-xs text-primary font-bold">
                      ■ FOUND 12 RELEVANT FILES
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <Code2 className="w-3 h-3 text-accent" />
                        <span className="text-muted-foreground">
                          packages/next/src/server/
                        </span>
                        <span className="text-foreground">auth.ts</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <Code2 className="w-3 h-3 text-accent" />
                        <span className="text-muted-foreground">
                          packages/next/src/client/
                        </span>
                        <span className="text-foreground">session.ts</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <Code2 className="w-3 h-3 text-accent" />
                        <span className="text-muted-foreground">examples/</span>
                        <span className="text-foreground">auth-example/</span>
                      </div>
                    </div>
                  </div>

                  {/* Graph preview hint */}
                  <div className="flex items-center justify-between text-xs border-t-2 border-border pt-4">
                    <span className="text-muted-foreground">
                      <GitBranch className="w-3 h-3 inline mr-1" />
                      Code graph ready
                    </span>
                    <span className="text-primary">VIEW GRAPH →</span>
                  </div>
                </div>
              </div>

              {/* Decorative shadow boxes */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-primary/30 -z-10" />
              <div className="absolute -bottom-8 -right-8 w-full h-full border-2 border-primary/10 -z-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent" />

        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-16">
            <div>
              <div className="text-xs font-bold text-primary tracking-widest mb-2">
                [ FEATURES ]
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                CORE CAPABILITIES
              </h2>
            </div>
            <div className="hidden md:block text-6xl font-bold text-muted-foreground/20">
              01
            </div>
          </div>

          {/* Feature grid - Asymmetric layout */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Large feature card */}
            <div className="md:col-span-2 bg-card border-2 border-border p-8 group hover:border-primary transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-primary/10 border-2 border-primary flex items-center justify-center">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                NATURAL LANGUAGE SEARCH
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Ask questions in plain English. Search any GitHub repository
                without knowing file names or code structures. Our AI
                understands context and finds exactly what you need.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold">
                  SEMANTIC
                </span>
                <span className="px-3 py-1 bg-accent/10 text-accent-foreground text-xs font-bold">
                  GITHUB API
                </span>
                <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-bold">
                  RAG
                </span>
              </div>
            </div>

            {/* Small feature card */}
            <div className="bg-card border-2 border-border p-8 group hover:border-primary transition-colors">
              <div className="w-14 h-14 bg-accent/10 border-2 border-accent flex items-center justify-center mb-6">
                <GitBranch className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                CODE GRAPHS
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Interactive visualisations showing file relationships, imports,
                and dependencies. Pan, zoom, and explore your codebase
                architecture.
              </p>
            </div>

            {/* Small feature card */}
            <div className="bg-card border-2 border-border p-8 group hover:border-primary transition-colors">
              <div className="w-14 h-14 bg-primary/10 border-2 border-primary flex items-center justify-center mb-6">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                REPO INDEXING
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Index repositories for lightning-fast semantic search. Chunked
                storage with vector embeddings across 10+ languages.
              </p>
            </div>

            {/* Small feature card */}
            <div className="bg-card border-2 border-border p-8 group hover:border-primary transition-colors">
              <div className="w-14 h-14 bg-accent/10 border-2 border-accent flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                AI CHAT
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Context-aware AI conversations about your code. Persistent
                history with real-time streaming responses.
              </p>
            </div>

            {/* Wide feature card */}
            <div className="md:col-span-1 bg-primary text-primary-foreground p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-14 h-14 bg-primary-foreground/10 border-2 border-primary-foreground/30 flex items-center justify-center">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div className="w-14 h-14 bg-primary-foreground/10 border-2 border-primary-foreground/30 flex items-center justify-center">
                  <Share2 className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-3">BOOKMARK & SHARE</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Save important conversations. Generate public links to share
                insights with your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-16">
            <div>
              <div className="text-xs font-bold text-primary tracking-widest mb-2">
                [ WORKFLOW ]
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                HOW IT WORKS
              </h2>
            </div>
            <div className="hidden md:block text-6xl font-bold text-muted-foreground/20">
              02
            </div>
          </div>

          {/* Process steps */}
          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-border" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "QUERY",
                  desc: "Ask natural language questions about any codebase functionality",
                  icon: Terminal,
                },
                {
                  step: "02",
                  title: "SEARCH",
                  desc: "AI processes your query using GitHub API or indexed RAG data",
                  icon: Search,
                },
                {
                  step: "03",
                  title: "VISUALISE",
                  desc: "Generate interactive code graphs showing relationships",
                  icon: Eye,
                },
                {
                  step: "04",
                  title: "ACTION",
                  desc: "Get actionable insights with key files and next steps",
                  icon: Zap,
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  {/* Step number */}
                  <div className="w-12 h-12 bg-background border-4 border-primary flex items-center justify-center mb-6 relative z-10">
                    <span className="text-sm font-bold text-primary">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Example query box */}
          <div className="mt-16 bg-card border-2 border-primary p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-xs font-bold text-primary mb-4">
                  EXAMPLE QUERY
                </div>
                <div className="bg-background border-2 border-border p-4 font-mono">
                  <span className="text-primary">$</span>
                  <span className="text-foreground ml-2">
                    &ldquo;How does the authentication flow work in this
                    codebase?&rdquo;
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 border border-border p-4 text-center">
                  <GitBranch className="w-5 h-5 text-primary mx-auto mb-2" />
                  <div className="text-xs font-bold text-foreground">
                    CODE GRAPH
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Visual cards
                  </div>
                </div>
                <div className="bg-muted/50 border border-border p-4 text-center">
                  <Code2 className="w-5 h-5 text-primary mx-auto mb-2" />
                  <div className="text-xs font-bold text-foreground">
                    SOURCES
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Direct links
                  </div>
                </div>
                <div className="bg-muted/50 border border-border p-4 text-center">
                  <Eye className="w-5 h-5 text-primary mx-auto mb-2" />
                  <div className="text-xs font-bold text-foreground">
                    CITATIONS
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Inline references
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card relative overflow-hidden">
        {/* Top border accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent" />

        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--primary)_1px,transparent_1px)] bg-size-[40px_40px]" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Section header */}
          <div className="flex items-center justify-between mb-16">
            <div>
              <div className="text-xs font-bold text-primary tracking-widest mb-2">
                [ METRICS ]
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                MEASURABLE IMPACT
              </h2>
            </div>
            <div className="hidden md:block text-6xl font-bold text-muted-foreground/20">
              03
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* TTFC Card */}
            <div className="bg-background border-2 border-border p-8 group hover:border-primary transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-primary/10 border-2 border-primary flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary">↓</div>
              </div>

              <div className="text-3xl font-bold text-foreground mb-2">
                TTFC
              </div>
              <div className="text-sm text-primary font-bold mb-4">
                Time-to-First-Commit
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Reduce onboarding time for new developers to make meaningful
                contributions to the codebase.
              </p>

              {/* Bottom bar */}
              <div className="mt-6 pt-4 border-t-2 border-border">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Faster ramp-up
                  </span>
                </div>
              </div>
            </div>

            {/* SAT Card - Featured */}
            <div className="bg-primary text-primary-foreground p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-primary-foreground/10 border-2 border-primary-foreground/30 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-4xl font-bold">↑</div>
              </div>

              <div className="text-3xl font-bold mb-2">SAT</div>
              <div className="text-sm font-bold mb-4 opacity-90">
                User Satisfaction
              </div>

              <p className="text-sm leading-relaxed opacity-80">
                Improved codebase understanding and navigation experience for
                all developers.
              </p>

              {/* Bottom bar */}
              <div className="mt-6 pt-4 border-t-2 border-primary-foreground/20">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-foreground" />
                  <span className="text-xs opacity-80">Higher engagement</span>
                </div>
              </div>
            </div>

            {/* EFF Card */}
            <div className="bg-background border-2 border-border p-8 group hover:border-primary transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-accent/10 border-2 border-accent flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent-foreground" />
                </div>
                <div className="text-4xl font-bold text-primary">↑</div>
              </div>

              <div className="text-3xl font-bold text-foreground mb-2">EFF</div>
              <div className="text-sm text-primary font-bold mb-4">
                Search Efficiency
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Faster discovery of relevant code compared to traditional search
                methods.
              </p>

              {/* Bottom bar */}
              <div className="mt-6 pt-4 border-t-2 border-border">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Instant results
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech-stack" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-16">
            <div>
              <div className="text-xs font-bold text-primary tracking-widest mb-2">
                [ TECHNOLOGY ]
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                TECH STACK
              </h2>
            </div>
            <div className="hidden md:block text-6xl font-bold text-muted-foreground/20">
              04
            </div>
          </div>

          {/* Tech categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                category: "FRONTEND",
                items: [
                  "Next.js 16",
                  "React Flow",
                  "Tailwind CSS",
                  "shadcn/ui",
                ],
              },
              {
                category: "AI / LLM",
                items: [
                  "Vercel AI SDK",
                  "OpenAI GPT",
                  "LangChain",
                  "RAG Pipeline",
                ],
              },
              {
                category: "DATABASE",
                items: [
                  "PostgreSQL",
                  "Prisma ORM",
                  "Upstash Vector",
                  "Redis Cache",
                ],
              },
              {
                category: "INFRA",
                items: ["Vercel", "BetterAuth", "GitHub API", "Sentry"],
              },
            ].map((stack, index) => (
              <div key={index} className="bg-card border-2 border-border p-6">
                <div className="text-xs font-bold text-primary mb-4 tracking-wider">
                  {stack.category}
                </div>
                <div className="space-y-2">
                  {stack.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-2 text-sm text-foreground"
                    >
                      <div className="w-1.5 h-1.5 bg-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 mb-8">
            <span className="text-xs font-bold text-primary tracking-wider">
              READY TO START?
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6">
            NAVIGATE YOUR CODE
            <span className="block text-primary">LIKE NEVER BEFORE</span>
          </h2>

          <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join the future of developer onboarding. Reduce friction, accelerate
            understanding, and make your first commit faster than ever.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="group relative inline-flex items-center justify-center px-10 py-5 bg-primary text-primary-foreground font-bold text-sm overflow-hidden transition-all hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                START YOUR JOURNEY
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
            <Link
              href="https://github.com/timooo-thy/ai-search"
              className="inline-flex items-center justify-center px-10 py-5 border-2 border-border text-foreground font-bold text-sm hover:border-primary hover:text-primary transition-colors"
            >
              <Github className="w-4 h-4 mr-2" />
              VIEW SOURCE
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
