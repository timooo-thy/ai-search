-- CreateEnum
CREATE TYPE "indexing_status" AS ENUM ('PENDING', 'CLONING', 'PARSING', 'INDEXING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "indexed_repository" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "status" "indexing_status" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "indexedFiles" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "lastIndexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexed_repository_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "indexed_repository_userId_idx" ON "indexed_repository"("userId");

-- CreateIndex
CREATE INDEX "indexed_repository_userId_status_idx" ON "indexed_repository"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "indexed_repository_userId_repoFullName_key" ON "indexed_repository"("userId", "repoFullName");
