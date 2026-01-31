/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `chat` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "chat" ADD COLUMN     "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "chat_shareToken_key" ON "chat"("shareToken");

-- CreateIndex
CREATE INDEX "chat_user_id_is_bookmarked_idx" ON "chat"("userId", "isBookmarked");
