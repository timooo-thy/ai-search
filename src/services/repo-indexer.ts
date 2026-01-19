"use server";

import { Octokit } from "octokit";
import { getUserGithubPAT } from "@/actions/ui-message-actions";
import {
  CodeChunk,
  CodeChunkMetadata,
  generateChunkId,
  upsertCodeChunks,
  deleteRepoChunks,
} from "@/lib/vector";
import prisma from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";
import { Parser, type ReadEntry } from "tar";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";

// File extensions to index
const INDEXABLE_EXTENSIONS = new Set([
  // JavaScript/TypeScript
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  // Python
  ".py",
  ".pyw",
  // Jupyter Notebooks
  ".ipynb",
  // Other common languages
  ".java",
  ".kt",
  ".scala",
  ".go",
  ".rs",
  ".rb",
  ".php",
  ".swift",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  // Config/markup that might have code
  ".vue",
  ".svelte",
]);

// Files/directories to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist\//,
  /build\//,
  /\.next\//,
  /\.vercel/,
  /coverage\//,
  /__pycache__/,
  /\.pytest_cache/,
  /venv\//,
  /\.env/,
  /\.min\./,
  /\.map$/,
  /\.lock$/,
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
];

type ParsedEntity = {
  type: "file" | "class" | "function" | "component" | "method";
  name: string;
  startLine: number;
  endLine: number;
  content: string;
  imports: string[];
  exportedSymbols: string[];
  parentClass?: string;
  calledFunctions: string[];
  docstring?: string; // Added for better semantic search
};

/**
 * Extract docstring/JSDoc comment before a code block
 */
function extractDocstring(
  lines: string[],
  startLine: number,
  ext: string,
): string | undefined {
  // Look backwards from startLine to find doc comments
  let docLines: string[] = [];

  for (let i = startLine - 2; i >= Math.max(0, startLine - 15); i--) {
    const line = lines[i].trim();

    if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
      // JSDoc style: /** ... */
      if (line.endsWith("*/")) {
        // Start of JSDoc block, collect upwards
        for (let j = i; j >= Math.max(0, i - 20); j--) {
          docLines.unshift(lines[j]);
          if (lines[j].trim().startsWith("/**")) break;
        }
        break;
      }
      // Single line comment
      if (line.startsWith("//")) {
        docLines.unshift(line.slice(2).trim());
        continue;
      }
    } else if ([".py", ".pyw"].includes(ext)) {
      // Python docstrings: """...""" or '''...'''
      if (line.startsWith('"""') || line.startsWith("'''")) {
        docLines.push(line.slice(3, -3));
        break;
      }
      // Comment
      if (line.startsWith("#")) {
        docLines.unshift(line.slice(1).trim());
        continue;
      }
    }

    // Stop if we hit non-comment code
    if (
      line &&
      !line.startsWith("//") &&
      !line.startsWith("#") &&
      !line.startsWith("*")
    ) {
      break;
    }
  }

  const doc = docLines.join(" ").trim();
  return doc.length > 10 ? doc.slice(0, 500) : undefined;
}

/**
 * Smart content truncation at logical boundaries
 */
function truncateAtBoundary(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;

  // Try to find a good break point
  const truncated = content.slice(0, maxLength);

  // Look for last complete statement (ending with }, ;, or newline after closing brace)
  const lastBrace = truncated.lastIndexOf("\n}");
  const lastSemicolon = truncated.lastIndexOf(";\n");
  const lastNewline = truncated.lastIndexOf("\n");

  const breakPoint = Math.max(lastBrace + 2, lastSemicolon + 2, lastNewline);

  if (breakPoint > maxLength * 0.5) {
    return content.slice(0, breakPoint) + "\n// ... truncated";
  }

  return truncated + "\n// ... truncated";
}

/**
 * Parse Jupyter notebook and extract code cells
 */
function parseNotebookContent(
  content: string,
  filePath: string,
): ParsedEntity[] {
  const entities: ParsedEntity[] = [];

  try {
    const notebook = JSON.parse(content);

    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      return entities;
    }

    const fileName = filePath.split("/").pop() || filePath;
    let cellIndex = 0;
    let currentLine = 1;

    // Collect all code from code cells for file-level chunk
    const allCode: string[] = [];
    const allMarkdown: string[] = [];

    for (const cell of notebook.cells) {
      const source = Array.isArray(cell.source)
        ? cell.source.join("")
        : cell.source || "";

      if (cell.cell_type === "code" && source.trim()) {
        allCode.push(source);
      } else if (cell.cell_type === "markdown" && source.trim()) {
        allMarkdown.push(source);
      }
    }

    // Add file-level chunk with notebook overview
    const notebookOverview = [
      `# Jupyter Notebook: ${fileName}`,
      "",
      "## Summary from Markdown cells:",
      ...allMarkdown.slice(0, 3).map((md) => md.slice(0, 300)),
      "",
      "## Code preview:",
      ...allCode.slice(0, 2).map((code) => code.slice(0, 500)),
    ].join("\n");

    entities.push({
      type: "file",
      name: fileName,
      startLine: 1,
      endLine: 1,
      content: truncateAtBoundary(notebookOverview, 3000),
      imports: extractImports(allCode.join("\n"), ".py"),
      exportedSymbols: [],
      calledFunctions: extractFunctionCalls(allCode.join("\n"), ".py"),
      docstring: allMarkdown[0]?.slice(0, 500),
    });

    // Process each code cell
    for (const cell of notebook.cells) {
      if (cell.cell_type !== "code") {
        cellIndex++;
        continue;
      }

      const source = Array.isArray(cell.source)
        ? cell.source.join("")
        : cell.source || "";

      if (!source.trim()) {
        cellIndex++;
        continue;
      }

      const lines = source.split("\n");
      const cellName = `cell_${cellIndex}`;

      // Add cell as a chunk
      entities.push({
        type: "function", // Treat cells as functions for graph purposes
        name: cellName,
        startLine: currentLine,
        endLine: currentLine + lines.length - 1,
        content: truncateAtBoundary(source, 2000),
        imports: extractImports(source, ".py"),
        exportedSymbols: extractExports(source, ".py"),
        calledFunctions: extractFunctionCalls(source, ".py"),
      });

      // Also extract functions/classes defined in the cell
      const cellEntities = extractFunctions(source, filePath, ".py", lines);
      cellEntities.forEach((entity) => {
        entity.startLine += currentLine - 1;
        entity.endLine += currentLine - 1;
        entity.name = `${cellName}::${entity.name}`;
      });
      entities.push(...cellEntities);

      const classEntities = extractClasses(source, filePath, ".py", lines);
      classEntities.forEach((entity) => {
        entity.startLine += currentLine - 1;
        entity.endLine += currentLine - 1;
        entity.name = `${cellName}::${entity.name}`;
      });
      entities.push(...classEntities);

      currentLine += lines.length;
      cellIndex++;
    }
  } catch (error) {
    // If JSON parsing fails, skip this notebook
    Sentry.captureException(error, {
      tags: { context: "notebook_parsing" },
      extra: { filePath },
    });
  }

  return entities;
}

/**
 * Parse a file and extract code entities
 */
function parseFileContent(content: string, filePath: string): ParsedEntity[] {
  const ext = filePath.substring(filePath.lastIndexOf("."));

  // Handle Jupyter notebooks specially
  if (ext === ".ipynb") {
    return parseNotebookContent(content, filePath);
  }

  const entities: ParsedEntity[] = [];
  const lines = content.split("\n");

  // Extract imports
  const imports = extractImports(content, ext);
  const exportedSymbols = extractExports(content, ext);

  // ALWAYS add a file-level chunk for imports/overview context
  // This ensures every file is discoverable
  const fileHeaderContent = lines
    .slice(0, Math.min(50, lines.length))
    .join("\n");
  entities.push({
    type: "file",
    name: filePath.split("/").pop() || filePath,
    startLine: 1,
    endLine: Math.min(50, lines.length),
    content: truncateAtBoundary(fileHeaderContent, 2000),
    imports,
    exportedSymbols,
    calledFunctions: extractFunctionCalls(fileHeaderContent, ext),
    docstring: extractDocstring(lines, 1, ext),
  });

  // For small files, also add the full content if different from header
  if (lines.length > 50 && lines.length <= 150) {
    entities.push({
      type: "file",
      name: `${filePath.split("/").pop() || filePath}:full`,
      startLine: 1,
      endLine: lines.length,
      content: truncateAtBoundary(content, 4000),
      imports,
      exportedSymbols,
      calledFunctions: extractFunctionCalls(content, ext),
    });
  }

  // Extract classes (with methods)
  const classEntities = extractClasses(content, filePath, ext, lines);
  entities.push(...classEntities);

  // Extract standalone functions (not in classes)
  const functionEntities = extractFunctions(content, filePath, ext, lines);
  entities.push(...functionEntities);

  // For React/Vue files, extract components
  if ([".tsx", ".jsx", ".vue", ".svelte"].includes(ext)) {
    const componentEntities = extractComponents(content, filePath, ext, lines);
    entities.push(...componentEntities);
  }

  return entities;
}

/**
 * Extract import statements
 */
function extractImports(content: string, ext: string): string[] {
  const imports: string[] = [];

  if ([".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(ext)) {
    // ES6 imports
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    // require statements
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  } else if ([".py", ".pyw"].includes(ext)) {
    // Python imports
    const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1] || match[2]);
    }
  }

  return [...new Set(imports)];
}

/**
 * Extract exported symbols
 */
function extractExports(content: string, ext: string): string[] {
  const exports: string[] = [];

  if ([".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(ext)) {
    // Named exports
    const namedExportRegex =
      /export\s+(?:const|let|var|function|class|async function)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    // Default exports
    if (/export\s+default/.test(content)) {
      exports.push("default");
    }
  }

  return exports;
}

/**
 * Extract function calls
 */
function extractFunctionCalls(content: string, ext: string): string[] {
  const calls: string[] = [];
  // Simple regex to find function calls - can be improved with AST
  const callRegex = /(\w+)\s*\(/g;
  let match;
  while ((match = callRegex.exec(content)) !== null) {
    // Skip common keywords
    if (
      !["if", "for", "while", "switch", "catch", "function", "class"].includes(
        match[1],
      )
    ) {
      calls.push(match[1]);
    }
  }
  return [...new Set(calls)].slice(0, 50); // Limit to avoid noise
}

/**
 * Extract class definitions and their methods
 */
function extractClasses(
  content: string,
  filePath: string,
  ext: string,
  lines: string[],
): ParsedEntity[] {
  const entities: ParsedEntity[] = [];

  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
    // JavaScript/TypeScript classes
    const classRegex =
      /^(\s*)(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/gm;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const startLine = content.slice(0, match.index).split("\n").length;
      let endLine = startLine;

      // Find the end of the class by tracking braces
      let braceCount = 0;
      let foundOpen = false;
      for (let i = startLine - 1; i < lines.length; i++) {
        const line = lines[i];
        for (const char of line) {
          if (char === "{") {
            braceCount++;
            foundOpen = true;
          } else if (char === "}") {
            braceCount--;
          }
        }
        if (foundOpen && braceCount === 0) {
          endLine = i + 1;
          break;
        }
      }

      const classContent = lines.slice(startLine - 1, endLine).join("\n");
      const className = match[2];

      // Add the class itself
      entities.push({
        type: "class",
        name: className,
        startLine,
        endLine,
        content: truncateAtBoundary(classContent, 2500),
        imports: extractImports(content, ext),
        exportedSymbols: [className],
        parentClass: match[3],
        calledFunctions: extractFunctionCalls(classContent, ext),
        docstring: extractDocstring(lines, startLine, ext),
      });

      // Extract methods within the class
      const methodEntities = extractMethods(
        classContent,
        className,
        startLine,
        ext,
      );
      entities.push(...methodEntities);
    }
  } else if ([".py", ".pyw"].includes(ext)) {
    // Python classes
    const classRegex = /^class\s+(\w+)(?:\(([^)]*)\))?:/gm;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const startLine = content.slice(0, match.index).split("\n").length;
      let endLine = startLine;

      // Find end by indentation
      const baseIndent = lines[startLine - 1].search(/\S/);
      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() && line.search(/\S/) <= baseIndent) {
          endLine = i;
          break;
        }
        endLine = i + 1;
      }

      const classContent = lines.slice(startLine - 1, endLine).join("\n");
      const parentClasses = match[2]?.split(",").map((s) => s.trim()) || [];
      const className = match[1];

      entities.push({
        type: "class",
        name: className,
        startLine,
        endLine,
        content: truncateAtBoundary(classContent, 2500),
        imports: extractImports(content, ext),
        exportedSymbols: [className],
        parentClass: parentClasses[0],
        calledFunctions: extractFunctionCalls(classContent, ext),
        docstring: extractDocstring(lines, startLine, ext),
      });

      // Extract Python methods
      const methodEntities = extractPythonMethods(
        classContent,
        className,
        startLine,
      );
      entities.push(...methodEntities);
    }
  }

  return entities;
}

/**
 * Extract methods from a JavaScript/TypeScript class
 */
function extractMethods(
  classContent: string,
  className: string,
  classStartLine: number,
  ext: string,
): ParsedEntity[] {
  const methods: ParsedEntity[] = [];
  const lines = classContent.split("\n");

  // Match class methods: methodName(...) { or async methodName(...) {
  const methodRegex =
    /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+(?:<[^>]+>)?)?\s*{/gm;
  let match;

  while ((match = methodRegex.exec(classContent)) !== null) {
    const methodName = match[1];
    // Skip constructor and common lifecycle methods as they're part of class chunk
    if (["constructor"].includes(methodName)) continue;

    const methodStartLine = classContent
      .slice(0, match.index)
      .split("\n").length;
    let methodEndLine = methodStartLine;

    // Find end by tracking braces
    let braceCount = 0;
    let foundOpen = false;
    for (
      let i = methodStartLine - 1;
      i < lines.length && i < methodStartLine + 80;
      i++
    ) {
      const line = lines[i];
      for (const char of line) {
        if (char === "{") {
          braceCount++;
          foundOpen = true;
        } else if (char === "}") {
          braceCount--;
        }
      }
      if (foundOpen && braceCount === 0) {
        methodEndLine = i + 1;
        break;
      }
      methodEndLine = i + 1;
    }

    const methodContent = lines
      .slice(methodStartLine - 1, methodEndLine)
      .join("\n");

    methods.push({
      type: "method",
      name: `${className}.${methodName}`,
      startLine: classStartLine + methodStartLine - 1,
      endLine: classStartLine + methodEndLine - 1,
      content: truncateAtBoundary(methodContent, 1500),
      imports: [],
      exportedSymbols: [],
      parentClass: className,
      calledFunctions: extractFunctionCalls(methodContent, ext),
    });
  }

  return methods;
}

/**
 * Extract methods from a Python class
 */
function extractPythonMethods(
  classContent: string,
  className: string,
  classStartLine: number,
): ParsedEntity[] {
  const methods: ParsedEntity[] = [];
  const lines = classContent.split("\n");

  // Match Python methods: def method_name(self, ...):
  const methodRegex = /^(\s+)def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?:/gm;
  let match;

  while ((match = methodRegex.exec(classContent)) !== null) {
    const methodName = match[2];
    const methodIndent = match[1].length;
    const methodStartLine = classContent
      .slice(0, match.index)
      .split("\n").length;
    let methodEndLine = methodStartLine;

    // Find end by indentation
    for (let i = methodStartLine; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() && line.search(/\S/) <= methodIndent) {
        methodEndLine = i;
        break;
      }
      methodEndLine = i + 1;
    }

    const methodContent = lines
      .slice(methodStartLine - 1, methodEndLine)
      .join("\n");

    methods.push({
      type: "method",
      name: `${className}.${methodName}`,
      startLine: classStartLine + methodStartLine - 1,
      endLine: classStartLine + methodEndLine - 1,
      content: truncateAtBoundary(methodContent, 1500),
      imports: [],
      exportedSymbols: [],
      parentClass: className,
      calledFunctions: extractFunctionCalls(methodContent, ".py"),
    });
  }

  return methods;
}

/**
 * Extract function definitions
 */
function extractFunctions(
  content: string,
  filePath: string,
  ext: string,
  lines: string[],
): ParsedEntity[] {
  const functions: ParsedEntity[] = [];

  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
    // JavaScript/TypeScript functions
    const funcRegex =
      /^(\s*)(?:export\s+)?(?:async\s+)?function\s+(\w+)|^(\s*)(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/gm;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[2] || match[4];
      if (!name) continue;

      const startLine = content.slice(0, match.index).split("\n").length;
      let endLine = startLine;

      // Find end by tracking braces/parens
      let braceCount = 0;
      let foundOpen = false;
      for (
        let i = startLine - 1;
        i < lines.length && i < startLine + 100;
        i++
      ) {
        const line = lines[i];
        for (const char of line) {
          if (char === "{") {
            braceCount++;
            foundOpen = true;
          } else if (char === "}") {
            braceCount--;
          }
        }
        if (foundOpen && braceCount === 0) {
          endLine = i + 1;
          break;
        }
        endLine = i + 1;
      }

      const funcContent = lines.slice(startLine - 1, endLine).join("\n");

      // Skip if this is inside a class (check indentation)
      const indent = (match[1] || match[3] || "").length;
      if (indent > 0) continue;

      functions.push({
        type: "function",
        name,
        startLine,
        endLine,
        content: truncateAtBoundary(funcContent, 1500),
        imports: [],
        exportedSymbols: [name],
        calledFunctions: extractFunctionCalls(funcContent, ext),
        docstring: extractDocstring(lines, startLine, ext),
      });
    }
  } else if ([".py", ".pyw"].includes(ext)) {
    // Python functions (top-level only)
    const funcRegex = /^def\s+(\w+)\s*\(/gm;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const startLine = content.slice(0, match.index).split("\n").length;

      // Check if top-level (no indentation)
      if (lines[startLine - 1].search(/\S/) > 0) continue;

      let endLine = startLine;
      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() && line.search(/\S/) === 0) {
          endLine = i;
          break;
        }
        endLine = i + 1;
      }

      const funcContent = lines.slice(startLine - 1, endLine).join("\n");

      functions.push({
        type: "function",
        name: match[1],
        startLine,
        endLine,
        content: truncateAtBoundary(funcContent, 1500),
        imports: [],
        exportedSymbols: [match[1]],
        calledFunctions: extractFunctionCalls(funcContent, ext),
        docstring: extractDocstring(lines, startLine, ext),
      });
    }
  }

  return functions;
}

/**
 * Extract React/Vue components
 */
function extractComponents(
  content: string,
  filePath: string,
  ext: string,
  lines: string[],
): ParsedEntity[] {
  const components: ParsedEntity[] = [];

  // Look for React functional components
  const componentRegex =
    /(?:export\s+)?(?:const|function)\s+(\w+).*?(?:=>|{)[\s\S]*?return\s*\(/g;
  let match;
  while ((match = componentRegex.exec(content)) !== null) {
    const name = match[1];
    // Check if name starts with uppercase (React convention)
    if (name[0] === name[0].toUpperCase()) {
      const startLine = content.slice(0, match.index).split("\n").length;

      components.push({
        type: "component",
        name,
        startLine,
        endLine: startLine + 50, // Approximate
        content: truncateAtBoundary(match[0], 1500),
        imports: extractImports(content, ext),
        exportedSymbols: [name],
        calledFunctions: [],
        docstring: extractDocstring(lines, startLine, ext),
      });
    }
  }

  return components;
}

/**
 * Should this file be indexed?
 */
function shouldIndexFile(filePath: string): boolean {
  // Check if should skip
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(filePath)) {
      return false;
    }
  }

  // Check extension
  const ext = filePath.substring(filePath.lastIndexOf("."));
  return INDEXABLE_EXTENSIONS.has(ext);
}

/**
 * Main indexing function for a repository
 * Uses tarball download for efficiency (single API call instead of one per file)
 */
export async function indexRepository(
  repoFullName: string,
  userId: string,
): Promise<void> {
  const [owner, repo] = repoFullName.split("/");

  // Get or create indexed repo record
  const indexedRepo = await prisma.indexedRepository.upsert({
    where: {
      userId_repoFullName: {
        userId,
        repoFullName,
      },
    },
    create: {
      userId,
      repoFullName,
      repoUrl: `https://github.com/${repoFullName}`,
      status: "CLONING",
      progress: 0,
    },
    update: {
      status: "CLONING",
      progress: 0,
      errorMessage: null,
    },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { githubPAT: true },
    });

    const githubPAT = user?.githubPAT;
    if (!githubPAT) {
      throw new Error("GitHub PAT not found");
    }

    const octokit = new Octokit({
      auth: githubPAT,
      request: {
        headers: { "X-GitHub-Api-Version": "2022-11-28" },
      },
    });

    // Get repository info
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    await prisma.indexedRepository.update({
      where: { id: indexedRepo.id },
      data: {
        branch: repoData.default_branch,
        status: "CLONING",
        progress: 5,
      },
    });

    // Download tarball - single API call instead of one per file!
    const tarballResponse = await octokit.rest.repos.downloadTarballArchive({
      owner,
      repo,
      ref: repoData.default_branch,
    });

    await prisma.indexedRepository.update({
      where: { id: indexedRepo.id },
      data: {
        status: "PARSING",
        progress: 15,
      },
    });

    // Parse tarball and extract files
    const files: Map<string, string> = new Map();
    const tarballData = tarballResponse.data as ArrayBuffer;

    await new Promise<void>((resolve, reject) => {
      const gunzip = createGunzip();
      const extract = new Parser({
        onReadEntry: (entry: ReadEntry) => {
          if (entry.type === "File") {
            // Remove the root directory prefix (e.g., "owner-repo-sha/")
            const pathParts = entry.path.split("/");
            pathParts.shift(); // Remove first segment
            const filePath = pathParts.join("/");

            if (filePath && shouldIndexFile(filePath)) {
              const chunks: Buffer[] = [];
              entry.on("data", (chunk: Buffer) => chunks.push(chunk));
              entry.on("end", () => {
                try {
                  const content = Buffer.concat(chunks).toString("utf-8");
                  // Skip binary files (check for null bytes)
                  if (!content.includes("\0")) {
                    files.set(filePath, content);
                  }
                } catch {
                  // Skip files that can't be decoded as UTF-8
                }
              });
            } else {
              entry.resume(); // Drain the entry
            }
          } else {
            entry.resume();
          }
        },
      });

      extract.on("end", resolve);
      extract.on("error", reject);
      gunzip.on("error", reject);

      const readable = Readable.from(Buffer.from(tarballData));
      pipeline(readable, gunzip, extract).catch(reject);
    });

    const filesToIndex = Array.from(files.entries());

    await prisma.indexedRepository.update({
      where: { id: indexedRepo.id },
      data: {
        totalFiles: filesToIndex.length,
        status: "INDEXING",
        progress: 25,
      },
    });

    // Delete existing chunks for this repo
    await deleteRepoChunks(repoFullName, userId);

    // Process all files locally
    const allChunks: CodeChunk[] = [];
    let processedFiles = 0;

    for (const [filePath, content] of filesToIndex) {
      try {
        // Parse the file
        const entities = parseFileContent(content, filePath);

        // Convert to chunks
        for (const entity of entities) {
          const metadata: CodeChunkMetadata = {
            repoFullName,
            userId,
            filePath,
            fileName: filePath.split("/").pop() || "",
            fileUrl: `https://github.com/${repoFullName}/blob/${repoData.default_branch}/${filePath}`,
            entityType: entity.type,
            entityName: entity.name,
            startLine: entity.startLine,
            endLine: entity.endLine,
            content: entity.content,
            docstring: entity.docstring,
            imports: entity.imports,
            exportedSymbols: entity.exportedSymbols,
            parentClass: entity.parentClass,
            calledFunctions: entity.calledFunctions,
          };

          allChunks.push({
            id: generateChunkId(
              userId,
              repoFullName,
              filePath,
              entity.name,
              entity.type,
            ),
            metadata,
          });
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "file_parsing" },
          extra: { filePath },
        });
      }

      processedFiles++;

      // Update progress periodically
      if (processedFiles % 50 === 0) {
        const progress = Math.min(
          25 + Math.floor((processedFiles / filesToIndex.length) * 50),
          75,
        );
        await prisma.indexedRepository.update({
          where: { id: indexedRepo.id },
          data: {
            indexedFiles: processedFiles,
            progress,
          },
        });
      }
    }

    // Upsert all chunks to vector DB in batches
    await prisma.indexedRepository.update({
      where: { id: indexedRepo.id },
      data: {
        indexedFiles: processedFiles,
        progress: 80,
      },
    });

    // Batch upsert to vector DB
    const batchSize = 100;
    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batch = allChunks.slice(i, i + batchSize);
      await upsertCodeChunks(batch);

      const progress = Math.min(
        80 + Math.floor(((i + batchSize) / allChunks.length) * 18),
        98,
      );
      await prisma.indexedRepository.update({
        where: { id: indexedRepo.id },
        data: { progress },
      });
    }

    // Mark as complete
    await prisma.indexedRepository.update({
      where: { id: indexedRepo.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        lastIndexedAt: new Date(),
      },
    });

    Sentry.logger.info(
      `Successfully indexed ${repoFullName}: ${processedFiles} files, ${allChunks.length} chunks`,
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: "repository_indexing" },
      extra: { repoFullName, userId },
    });

    await prisma.indexedRepository.update({
      where: { id: indexedRepo.id },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    });

    throw error;
  }
}

/**
 * Get indexing status for a repository
 */
export async function getIndexingStatus(repoFullName: string, userId: string) {
  return prisma.indexedRepository.findUnique({
    where: {
      userId_repoFullName: {
        userId,
        repoFullName,
      },
    },
  });
}

/**
 * Get all indexed repositories for a user
 */
export async function getIndexedRepositories(userId: string) {
  return prisma.indexedRepository.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Delete an indexed repository
 */
export async function deleteIndexedRepository(
  repoFullName: string,
  userId: string,
) {
  // Try to delete from vector DB (don't fail if vectors don't exist)
  try {
    await deleteRepoChunks(repoFullName, userId);
  } catch (error) {
    // Log but don't fail - we still want to delete the DB record
    Sentry.captureException(error, {
      tags: { context: "delete_vector_chunks" },
      extra: { repoFullName, userId },
      level: "warning",
    });
  }

  // Delete from database
  await prisma.indexedRepository.delete({
    where: {
      userId_repoFullName: {
        userId,
        repoFullName,
      },
    },
  });
}
