"use server";

import { Octokit } from "octokit";
import {
  RecursiveCharacterTextSplitter,
  type SupportedTextSplitterLanguage,
} from "@langchain/textsplitters";
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

// Chunk configuration optimised for code discovery
// 1500 chars with 200 chars overlap
const CODE_CHUNK_SIZE = 1500;
const CODE_CHUNK_OVERLAP = 200;

// Map file extensions to LangChain supported languages
const EXTENSION_TO_LANGUAGE: Record<string, SupportedTextSplitterLanguage> = {
  // JavaScript/TypeScript
  ".js": "js",
  ".jsx": "js",
  ".ts": "js",
  ".tsx": "js",
  ".mjs": "js",
  ".cjs": "js",
  // Python
  ".py": "python",
  ".pyw": "python",
  // Other languages
  ".java": "java",
  ".go": "go",
  ".rs": "rust",
  ".rb": "ruby",
  ".php": "php",
  ".swift": "swift",
  ".scala": "scala",
  ".cpp": "cpp",
  ".c": "cpp",
  ".h": "cpp",
  ".hpp": "cpp",
  // Markup
  ".md": "markdown",
  ".html": "html",
  ".htm": "html",
  ".vue": "html",
  ".svelte": "html",
};

// File extensions to index (including those without specific language support)
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
  ".md",
  ".html",
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

/**
 * Get the appropriate text splitter for a file based on its extension
 */
function getSplitterForFile(filePath: string): RecursiveCharacterTextSplitter {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  const language = EXTENSION_TO_LANGUAGE[ext];

  if (language) {
    return RecursiveCharacterTextSplitter.fromLanguage(language, {
      chunkSize: CODE_CHUNK_SIZE,
      chunkOverlap: CODE_CHUNK_OVERLAP,
    });
  }

  // Fallback: generic splitter for unsupported languages
  return new RecursiveCharacterTextSplitter({
    chunkSize: CODE_CHUNK_SIZE,
    chunkOverlap: CODE_CHUNK_OVERLAP,
    separators: [
      "\nclass ",
      "\ndef ",
      "\nfunction ",
      "\nconst ",
      "\nlet ",
      "\nvar ",
      "\n\n",
      "\n",
      " ",
      "",
    ],
  });
}

/**
 * Parse Jupyter notebook and extract code content
 */
function parseNotebookContent(content: string): string {
  try {
    const notebook = JSON.parse(content);

    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      return "";
    }

    const codeBlocks: string[] = [];
    const markdownBlocks: string[] = [];

    for (const cell of notebook.cells) {
      const source = Array.isArray(cell.source)
        ? cell.source.join("")
        : cell.source || "";

      if (cell.cell_type === "code" && source.trim()) {
        codeBlocks.push(source);
      } else if (cell.cell_type === "markdown" && source.trim()) {
        markdownBlocks.push(source);
      }
    }

    // Combine markdown context with code
    const combined: string[] = [];
    if (markdownBlocks.length > 0) {
      combined.push("# Notebook Documentation\n");
      combined.push(markdownBlocks.slice(0, 3).join("\n\n"));
      combined.push("\n\n# Code Cells\n");
    }
    combined.push(codeBlocks.join("\n\n# ---\n\n"));

    return combined.join("\n");
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: "notebook_parsing" },
    });
    return "";
  }
}

/**
 * Split file content into chunks using LangChain's RecursiveCharacterTextSplitter
 */
async function splitFileContent(
  content: string,
  filePath: string,
): Promise<{ content: string; startLine: number; endLine: number }[]> {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();

  // Handle Jupyter notebooks specially
  let textToSplit = content;
  if (ext === ".ipynb") {
    textToSplit = parseNotebookContent(content);
    if (!textToSplit) return [];
  }

  const splitter = getSplitterForFile(filePath);

  try {
    const docs = await splitter.createDocuments([textToSplit], [{}], {});

    return docs.map((doc) => ({
      content: doc.pageContent,
      startLine: doc.metadata.loc?.lines?.from ?? 1,
      endLine: doc.metadata.loc?.lines?.to ?? 1,
    }));
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: "code_splitting" },
      extra: { filePath },
    });
    return [];
  }
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
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  return INDEXABLE_EXTENSIONS.has(ext);
}

/**
 * Main indexing function for a repository
 * Uses tarball download for efficiency (single API call instead of one per file)
 * Uses LangChain RecursiveCharacterTextSplitter for language-aware code chunking
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

    // Process all files using LangChain code splitter
    const allChunks: CodeChunk[] = [];
    let processedFiles = 0;

    for (const [filePath, content] of filesToIndex) {
      try {
        // Split the file content using LangChain
        const splitChunks = await splitFileContent(content, filePath);

        // Convert to our chunk format
        for (let i = 0; i < splitChunks.length; i++) {
          const chunk = splitChunks[i];
          const chunkName = `${filePath}:chunk_${i}`;

          const metadata: CodeChunkMetadata = {
            repoFullName,
            userId,
            filePath,
            fileName: filePath.split("/").pop() || "",
            fileUrl: `https://github.com/${repoFullName}/blob/${repoData.default_branch}/${filePath}`,
            chunkIndex: i,
            totalChunks: splitChunks.length,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            content: chunk.content,
          };

          allChunks.push({
            id: generateChunkId(userId, repoFullName, filePath, chunkName),
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
