/*
  Warnings:

  - A unique constraint covering the columns `[id,userId]` on the table `chat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "chat_user_id_idx" ON "public"."chat"("userId");

-- CreateIndex
CREATE INDEX "chat_user_id_updated_at_idx" ON "public"."chat"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "chat_id_userId_key" ON "public"."chat"("id", "userId");
