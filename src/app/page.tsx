import Link from "next/link";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8">
              <span className="text-sm font-medium">
                🚀 Accelerating Developer Onboarding
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Code Orientation AI
              <span className="block text-primary">Made Simple</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Reduce time-to-first-commit and onboarding time for engineers with
              AI-powered natural language search, code graph visualisation, and
              actionable insights for any codebase.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/chat"
                className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg"
              >
                Start Exploring Code
              </Link>
              <button className="border border-border px-8 py-4 rounded-lg font-semibold text-lg hover:bg-muted transition-all">
                Watch Demo
              </button>
            </div>

            {/* Hero Visual */}
            <div className="relative max-w-5xl mx-auto">
              <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b border-border">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="ml-4 text-sm text-muted-foreground">
                      CodeOrient AI - Search Interface
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="bg-background border border-border rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">
                          🔍
                        </span>
                      </div>
                      <span className="text-muted-foreground italic">
                        &ldquo;How does the authentication flow work in this
                        codebase?&ldquo;
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        🏗️ Code Graph
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Visual relationships & dependencies
                      </p>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        📁 Key Files
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Important files with direct links
                      </p>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        👥 Ownership
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Top contributors & activity
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              The Developer Onboarding Challenge
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              New developers struggle with unfamiliar codebases, leading to
              delays and inconsistent onboarding experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏱️</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Time Delays
              </h3>
              <p className="text-muted-foreground">
                Traditional search methods are inefficient and overwhelming,
                slowing down the onboarding process significantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Search Difficulties
              </h3>
              <p className="text-muted-foreground">
                Finding relevant information without knowing specific file names
                or code structures is challenging.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Inconsistent Experiences
              </h3>
              <p className="text-muted-foreground">
                Inconsistent onboarding processes lead to varied experiences and
                unreliable AI code assistance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Core Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful AI-driven tools designed to accelerate developer
              productivity and understanding.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🗣️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Natural Language Search
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Search codebases using natural language queries without
                    needing to know specific file names or code structures. Ask
                    questions like &ldquo;How does authentication work?&rdquo;
                    and get relevant results instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🕸️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Code Graph Visualisation
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Generate visual representations of codebase structure,
                    including file relationships and dependencies. Quickly
                    understand the architecture and navigate complex codebases
                    with ease.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Actionable Feature Cards
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Get insights and actions based on your search queries. See
                    ownership & activity, key files, and suggested next steps
                    for deeper exploration of related features.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Search Templates
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Quick toggles for repository, organisation, path, language,
                    and filename searches. Streamline your search experience
                    with predefined filters and templates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A simple, AI-powered workflow that transforms how you explore and
              understand codebases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                1
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Input Query
              </h3>
              <p className="text-muted-foreground">
                Ask natural language questions about the codebase functionality
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                2
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                AI Search
              </h3>
              <p className="text-muted-foreground">
                AI agent processes query and searches using GitHub API for
                relevant code
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                3
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Generate Graph
              </h3>
              <p className="text-muted-foreground">
                Create visual code graph showing relationships and dependencies
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                4
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Action Cards
              </h3>
              <p className="text-muted-foreground">
                Present actionable insights with ownership, key files, and next
                steps
              </p>
            </div>
          </div>

          {/* Example Flow */}
          <div className="mt-16 bg-card border border-border rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6 text-center">
              Example Flow
            </h3>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-primary font-semibold">Query:</span>
                <span className="text-foreground italic">
                  &ldquo;How does the authentication flow work in this
                  codebase?&rdquo;
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-muted/50 border border-border rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <span className="mr-2">👥</span>
                  Ownership & Activity
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Top committers identified</li>
                  <li>• Last modification dates</li>
                  <li>• Related issues/PRs linked</li>
                </ul>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <span className="mr-2">📁</span>
                  Key Files
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Important auth files listed</li>
                  <li>• Direct codebase links</li>
                  <li>• File relationship mapping</li>
                </ul>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-3 flex items-center">
                  <span className="mr-2">🎯</span>
                  Next Steps
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Related feature suggestions</li>
                  <li>• Component interactions</li>
                  <li>• Further exploration paths</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Success Metrics
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Measurable improvements in developer productivity and
              satisfaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-card border border-border rounded-2xl">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Time-to-First-Commit
              </h3>
              <p className="text-muted-foreground">
                Measure and reduce the time for new developers to make their
                first meaningful contribution to the project.
              </p>
            </div>

            <div className="text-center p-8 bg-card border border-border rounded-2xl">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">😊</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                User Satisfaction
              </h3>
              <p className="text-muted-foreground">
                Conduct surveys to assess satisfaction levels regarding the
                onboarding process and codebase navigation.
              </p>
            </div>

            <div className="text-center p-8 bg-card border border-border rounded-2xl">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Onboarding Time
              </h3>
              <p className="text-muted-foreground">
                Track the time required for new developers to become familiar
                with the codebase structure and patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section
        id="tech-stack"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Built with Modern Technologies
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leveraging cutting-edge tools and frameworks for optimal
              performance and scalability.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: "Next.js", icon: "⚛️", category: "Frontend" },
              { name: "LangGraph", icon: "🧠", category: "AI" },
              { name: "OpenAI", icon: "🤖", category: "AI" },
              { name: "PostgreSQL", icon: "🐘", category: "Database" },
              { name: "Prisma", icon: "🔷", category: "ORM" },
              { name: "Vercel", icon: "▲", category: "Hosting" },
              { name: "BetterAuth", icon: "🔐", category: "Auth" },
              { name: "React Query", icon: "🔄", category: "State" },
              { name: "Tailwind", icon: "🎨", category: "Styling" },
              { name: "Shadcn/UI", icon: "🎯", category: "Components" },
              { name: "GitHub API", icon: "🐙", category: "Search" },
              { name: "Redis", icon: "🔴", category: "Cache" },
            ].map((tech, index) => (
              <div
                key={index}
                className="text-center p-6 bg-card border border-border rounded-xl hover:shadow-lg transition-all"
              >
                <div className="text-3xl mb-3">{tech.icon}</div>
                <div className="font-semibold text-foreground text-sm mb-1">
                  {tech.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {tech.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Codebase Experience?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join the future of developer onboarding with AI-powered code
            exploration and understanding.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/chat"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Your Journey
            </Link>
            <button className="border border-border px-8 py-4 rounded-lg font-semibold text-lg hover:bg-muted transition-all">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    AI
                  </span>
                </div>
                <span className="text-xl font-bold text-foreground">
                  CodeOrient
                </span>
              </div>
              <p className="text-muted-foreground">
                Accelerating developer onboarding with AI-powered code
                exploration.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Product</h3>
              <div className="space-y-2">
                <Link
                  href="#features"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  How it Works
                </Link>
                <Link
                  href="/chat"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Demo
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Technology</h3>
              <div className="space-y-2">
                <Link
                  href="#tech-stack"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tech Stack
                </Link>
                <Link
                  href="#"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  API Documentation
                </Link>
                <Link
                  href="#"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Integration Guide
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Resources</h3>
              <div className="space-y-2">
                <Link
                  href="#"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
                <Link
                  href="#"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Support
                </Link>
                <Link
                  href="#"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; 2025 CodeOrient AI. Built with ❤️ for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
