import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  indexRepository,
  getIndexedRepositories,
  getIndexingStatus,
  deleteIndexedRepository,
} from "@/services/repo-indexer";
import prisma from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";

const MAX_INDEXED_REPOS = 5;

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for indexing

/**
 * GET /api/indexing - Get all indexed repositories for the user
 * GET /api/indexing?repo=owner/repo - Get status for a specific repo
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const repoFullName = request.nextUrl.searchParams.get("repo");

    if (repoFullName) {
      // Get specific repo status
      const status = await getIndexingStatus(repoFullName, session.user.id);
      return NextResponse.json({ status });
    } else {
      // Get all indexed repos
      const repositories = await getIndexedRepositories(session.user.id);
      return NextResponse.json({ repositories });
    }
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to get indexing status" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/indexing - Start indexing a repository
 * Body: { repoFullName: "owner/repo" }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoFullName } = await request.json();

    if (!repoFullName || !repoFullName.includes("/")) {
      return NextResponse.json(
        { error: "Invalid repository name. Use format: owner/repo" },
        { status: 400 },
      );
    }

    // Enforce repo limit (count non-FAILED repos)
    const existing = await getIndexingStatus(repoFullName, session.user.id);
    const isNewRepo = !existing || existing.status === "FAILED";

    if (isNewRepo) {
      const activeCount = await prisma.indexedRepository.count({
        where: {
          userId: session.user.id,
          status: { not: "FAILED" },
        },
      });

      if (activeCount >= MAX_INDEXED_REPOS) {
        return NextResponse.json(
          {
            error: `Repository limit reached (${MAX_INDEXED_REPOS}/${MAX_INDEXED_REPOS}). Delete a repo to index a new one.`,
          },
          { status: 403 },
        );
      }
    }

    // Check if already indexing
    if (
      existing?.status === "CLONING" ||
      existing?.status === "PARSING" ||
      existing?.status === "INDEXING"
    ) {
      return NextResponse.json(
        { error: "Repository is already being indexed", status: existing },
        { status: 409 },
      );
    }

    // Start indexing in background using after()
    // This keeps the function alive after response is sent (Vercel supported)
    after(async () => {
      try {
        await indexRepository(repoFullName, session.user.id);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: "background_indexing" },
          extra: { repoFullName, userId: session.user.id },
        });
      }
    });

    // Return immediately with status
    const status = await getIndexingStatus(repoFullName, session.user.id);
    return NextResponse.json({
      message: "Indexing started",
      status,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to start indexing" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/indexing?repo=owner/repo - Delete an indexed repository
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const repoFullName = request.nextUrl.searchParams.get("repo");

    if (!repoFullName) {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 },
      );
    }

    await deleteIndexedRepository(repoFullName, session.user.id);

    return NextResponse.json({ message: "Repository deleted successfully" });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 },
    );
  }
}
