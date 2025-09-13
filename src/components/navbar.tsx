"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { authClient, Session } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { ModeToggle } from "./mode-toggle";

interface NavbarProps {
  user?: Session["user"] | null;
}

export function Navbar({ user }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          redirect("/auth/login");
        },
      },
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                AI
              </span>
            </div>
            <span className="text-xl font-bold text-foreground">
              CodeOrient
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              // Authenticated navigation
              <>
                <Link
                  href="/chat"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  AI Chat
                </Link>
                <Link
                  href="/projects"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Projects
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {user.name?.charAt(0).toUpperCase() ||
                            user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center text-red-600 dark:text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ModeToggle />
              </>
            ) : (
              // Unauthenticated navigation
              <>
                <Link
                  href="#features"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  How it Works
                </Link>
                <Link
                  href="#tech-stack"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tech Stack
                </Link>
                <Link
                  href="/chat"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Try Demo
                </Link>
                <ModeToggle />
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
            <ModeToggle />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-background/95 backdrop-blur-lg border-t border-border">
              {user ? (
                // Authenticated mobile navigation
                <>
                  <Link
                    href="/chat"
                    className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    AI Chat
                  </Link>
                  <Link
                    href="/projects"
                    className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-muted transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                // Unauthenticated mobile navigation
                <>
                  <Link
                    href="#features"
                    className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    How it Works
                  </Link>
                  <Link
                    href="#tech-stack"
                    className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tech Stack
                  </Link>
                  <Link
                    href="/chat"
                    className="block px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-3 mt-2 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Try Demo
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
