import { FusionAlgorithm, Index, WeightingStrategy } from "@upstash/vector";

/**
 * Sanitise a string value for use in Upstash Vector filter queries.
 * Prevents injection attacks by escaping special characters.
 */
function sanitiseFilterValue(value: string): string {
  // Remove or escape characters that could break the filter syntax
  // Upstash uses SQL-like filter syntax with single quotes
  return value
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/[\x00-\x1f\x7f]/g, ""); // Remove control characters
}

/**
 * Initialise Upstash Vector client for hybrid search (sparse + dense)
 */
export const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Simplified metadata type for LangChain-based chunking
export type CodeChunkMetadata = {
  // Repository info
  repoFullName: string; // "owner/repo"
  userId: string;

  // File info
  filePath: string;
  fileName: string;
  fileUrl: string;

  // Chunk info
  chunkIndex: number;
  totalChunks: number;
  startLine: number;
  endLine: number;

  // Content - the actual code chunk
  content: string;
};

export type CodeChunk = {
  id: string;
  metadata: CodeChunkMetadata;
};

/**
 * Generate a unique ID for a code chunk
 * Includes userId to namespace chunks per user and prevent cross-user data access
 */
export function generateChunkId(
  userId: string,
  repoFullName: string,
  filePath: string,
  chunkName: string,
): string {
  return `${userId}::${repoFullName}::${filePath}::${chunkName}`.replace(
    /[^a-zA-Z0-9:_\-./]/g,
    "_",
  );
}

/**
 * Search for code chunks using hybrid search (dense + sparse with DBSF fusion)
 *
 * This uses Upstash's hybrid index capabilities:
 * - Dense search (semantic): Captures meaning and context
 * - Sparse search (keyword): Captures exact function names, variables, etc.
 * - DBSF fusion: Distribution-Based Score Fusion for optimal ranking
 */
export async function searchCodeChunks(
  query: string,
  repoFullName: string,
  userId: string,
  topK: number = 10,
): Promise<CodeChunk[]> {
  const results = await vectorIndex.query({
    data: query,
    topK,
    includeData: true,
    includeMetadata: true,
    // Hybrid search configuration
    fusionAlgorithm: FusionAlgorithm.DBSF, // Distribution-Based Score Fusion
    weightingStrategy: WeightingStrategy.IDF, // Inverse Document Frequency for sparse
    filter: `repoFullName = '${sanitiseFilterValue(repoFullName)}' AND userId = '${sanitiseFilterValue(userId)}'`,
  });

  return results.map((result) => ({
    id: result.id as string,
    metadata: result.metadata as unknown as CodeChunkMetadata,
  }));
}

/**
 * Upsert code chunks into the vector index
 *
 * Uses the `data` field for automatic embedding by Upstash.
 * The hybrid index will generate both dense and sparse vectors automatically.
 */
export async function upsertCodeChunks(chunks: CodeChunk[]): Promise<void> {
  if (chunks.length === 0) return;

  // Upstash Vector has a limit of 1000 vectors per upsert
  const batchSize = 100;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    await vectorIndex.upsert(
      batch.map((chunk) => ({
        id: chunk.id,
        data: chunk.metadata.content,
        metadata: chunk.metadata,
      })),
    );
  }
}

/**
 * Delete all code chunks for a repository using namespace or ID prefix
 * Note: We use a prefix-based approach to avoid expensive queries
 */
export async function deleteRepoChunks(
  repoFullName: string,
  userId: string,
  chunkIds?: string[],
): Promise<void> {
  // If we have the chunk IDs, delete them directly
  if (chunkIds && chunkIds.length > 0) {
    const batchSize = 1000;
    for (let i = 0; i < chunkIds.length; i += batchSize) {
      const batch = chunkIds.slice(i, i + batchSize);
      await vectorIndex.delete(batch);
    }
    return;
  }

  // Otherwise, we need to query to get IDs
  // Use range query with prefix if possible
  // Prefix includes userId to ensure we only delete this user's chunks
  const prefix = `${userId}::${repoFullName}::`;
  try {
    // Try using range with prefix - paginate to avoid read limits
    let cursor = 0;
    const allIdsToDelete: string[] = [];

    // Paginate through results
    while (true) {
      const results = await vectorIndex.range({
        cursor,
        limit: 1000, // Reduced from 10000 to stay within limits
        includeMetadata: false,
      });

      // Handle case where no vectors exist
      if (!results.vectors || results.vectors.length === 0) {
        break;
      }

      const matchingIds = results.vectors
        .filter((v) => (v.id as string).startsWith(prefix))
        .map((v) => v.id as string);

      allIdsToDelete.push(...matchingIds);

      // Check if we've reached the end
      if (
        results.nextCursor === undefined ||
        results.nextCursor === "0" ||
        results.vectors.length < 1000
      ) {
        break;
      }
      cursor = Number(results.nextCursor);
    }

    if (allIdsToDelete.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < allIdsToDelete.length; i += batchSize) {
        const batch = allIdsToDelete.slice(i, i + batchSize);
        await vectorIndex.delete(batch);
      }
    }
  } catch (error) {
    // Check if it's a "no vectors" error and handle gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("no vectors") || errorMessage.includes("empty")) {
      return; // No vectors to delete, that's fine
    }

    // Fallback to query-based deletion with hybrid search
    try {
      const results = await vectorIndex.query({
        data: "code function class",
        topK: 10000,
        includeMetadata: true,
        fusionAlgorithm: FusionAlgorithm.DBSF,
        filter: `repoFullName = '${sanitiseFilterValue(repoFullName)}' AND userId = '${sanitiseFilterValue(userId)}'`,
      });

      if (results.length > 0) {
        const ids = results.map((r) => r.id as string);
        const batchSize = 1000;
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          await vectorIndex.delete(batch);
        }
      }
    } catch (queryError) {
      // If query also fails, check if it's because there are no vectors
      const queryErrorMessage =
        queryError instanceof Error ? queryError.message : String(queryError);
      if (
        queryErrorMessage.includes("no vectors") ||
        queryErrorMessage.includes("empty")
      ) {
        return; // No vectors to delete, that's fine
      }
      throw queryError; // Re-throw if it's a real error
    }
  }
}

/**
 * Get all unique file paths indexed for a repository
 * NOTE: This is expensive on Upstash free tier - prefer using DB to track indexed files
 */
export async function getIndexedFiles(
  repoFullName: string,
  userId: string,
): Promise<string[]> {
  const results = await vectorIndex.query({
    data: "code file",
    topK: 1000, // Reduced from 10000 to save reads
    includeMetadata: true,
    fusionAlgorithm: FusionAlgorithm.DBSF,
    filter: `repoFullName = '${sanitiseFilterValue(repoFullName)}' AND userId = '${sanitiseFilterValue(userId)}'`,
  });

  const filePaths = new Set<string>();
  results.forEach((r) => {
    const metadata = r.metadata as unknown as CodeChunkMetadata;
    if (metadata?.filePath) {
      filePaths.add(metadata.filePath);
    }
  });

  return Array.from(filePaths);
}

/**
 * Check if a repository is indexed
 * NOTE: Prefer using getIndexingStatus from repo-indexer.ts instead to save vector DB reads
 */
export async function isRepoIndexed(
  repoFullName: string,
  userId: string,
): Promise<boolean> {
  const results = await vectorIndex.query({
    data: "code",
    topK: 1,
    fusionAlgorithm: FusionAlgorithm.DBSF,
    filter: `repoFullName = '${sanitiseFilterValue(repoFullName)}' AND userId = '${sanitiseFilterValue(userId)}'`,
  });

  return results.length > 0;
}
