import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_URL ?? "https://codeorient.vercel.app",
  ),
  title: "CodeOrient",
  description: "An intelligent way to search your codebase using Agentic AI.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "CodeOrient",
    description:
      "Navigate any codebase with AI precision. Natural language search, interactive code graphs, and RAG-powered repository indexing.",
    url: "/",
    siteName: "CodeOrient",
    images: [
      {
        url: "/og/home.png",
        width: 1200,
        height: 630,
        alt: "CodeOrient — Navigate any codebase with AI precision",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeOrient",
    description:
      "Navigate any codebase with AI precision. Natural language search, interactive code graphs, and RAG-powered repository indexing.",
    images: ["/og/home.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
