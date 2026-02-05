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
import { User, Settings, LogOut, Menu, X, Terminal } from "lucide-react";
import { useState, useEffect } from "react";
import { authClient, Session } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { ModeToggle } from "./mode-toggle";

interface NavbarProps {
  user?: Session["user"] | null;
}

export function Navbar({ user }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  // Occasional glitch effect on logo
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b-4 border-primary">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div
              className={`relative w-10 h-10 bg-primary flex items-center justify-center transition-transform group-hover:scale-110 ${glitchActive ? "animate-pulse" : ""}`}
            >
              {/* Pixel corners */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary" />
              <Terminal className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm font-bold text-foreground tracking-wider ${glitchActive ? "translate-x-0.5 text-primary" : ""} transition-all`}
              >
                CODE
              </span>
              <span
                className={`text-sm font-bold text-primary tracking-wider ${glitchActive ? "-translate-x-0.5 text-foreground" : ""} transition-all`}
              >
                ORIENT
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <Link
                  href="/chat"
                  className="relative px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="relative z-10">[CHAT]</span>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </Link>
                <Link
                  href="/dashboard"
                  className="relative px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="relative z-10">[DASHBOARD]</span>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </Link>

                {/* Separator */}
                <div className="w-px h-6 bg-border mx-2" />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hover:bg-primary/10 cursor-pointer px-3"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/20 border-2 border-primary flex items-center justify-center">
                          <span className="text-primary font-bold text-xs">
                            {user.name?.charAt(0).toUpperCase() ||
                              user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">▼</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 border-2 border-primary"
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="flex items-center text-xs"
                      >
                        <User className="mr-2 h-4 w-4" />
                        {">"} ACCOUNT
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="flex items-center text-xs"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {">"} SETTINGS
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center text-xs text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {">"} LOGOUT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ModeToggle />
              </>
            ) : (
              <>
                <Link
                  href="#features"
                  className="relative px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="relative z-10">[FEATURES]</span>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="relative px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="relative z-10">[HOW]</span>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </Link>
                <Link
                  href="#tech-stack"
                  className="relative px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="relative z-10">[TECH]</span>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </Link>

                {/* Separator */}
                <div className="w-px h-6 bg-border mx-2" />

                <Link
                  href="/chat"
                  className="relative px-6 py-2 bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all group overflow-hidden"
                >
                  <span className="relative z-10">START »</span>
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                </Link>
                <ModeToggle />
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <ModeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="border-2 border-primary p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-primary" />
              ) : (
                <Menu className="h-5 w-5 text-primary" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t-2 border-primary">
            <div className="py-4 space-y-1 bg-background">
              {user ? (
                <>
                  <Link
                    href="/chat"
                    className="block px-4 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {">"} CHAT
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {">"} DASHBOARD
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {">"} SETTINGS
                  </Link>
                  <div className="border-t border-border my-2" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-3 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    {">"} LOGOUT
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="#features"
                    className="block px-4 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {">"} FEATURES
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="block px-4 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {">"} HOW IT WORKS
                  </Link>
                  <Link
                    href="#tech-stack"
                    className="block px-4 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {">"} TECH STACK
                  </Link>
                  <div className="border-t border-border my-2" />
                  <Link
                    href="/chat"
                    className="block mx-4 py-3 bg-primary text-primary-foreground text-xs font-bold text-center hover:bg-primary/90 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    START DEMO »
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
