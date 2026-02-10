import { marked } from "marked";
import { memo, useMemo, useState, useCallback } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);
  const { theme = "light" } = useTheme();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-border group/code">
      <div className="flex items-center justify-between bg-muted/80 px-4 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{language || "text"}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1 opacity-0 group-hover/code:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={theme === "dark" ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.8125rem",
          lineHeight: "1.6",
        }}
        showLineNumbers={children.split("\n").length > 3}
        wrapLines
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/50 hover:decoration-primary font-medium transition-colors"
    >
      {children}
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");

    // Block code (has language class or multi-line)
    if (match || codeString.includes("\n")) {
      return <CodeBlock language={match?.[1] || ""}>{codeString}</CodeBlock>;
    }

    // Inline code
    return (
      <code
        className="rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 font-mono text-[0.9em] text-primary"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mt-6 mb-3 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold mt-5 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="my-2 leading-7 first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 ml-6 list-disc space-y-1 [&>li]:pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-6 list-decimal space-y-1 [&>li]:pl-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt || ""}
      className="my-3 max-w-full rounded-lg border border-border"
    />
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  table: ({ children }) => (
    <div className="my-3 w-full overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-3 py-2">{children}</td>
  ),
  tr: ({ children }) => <tr className="even:bg-muted/30">{children}</tr>,
};

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  },
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: number }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
