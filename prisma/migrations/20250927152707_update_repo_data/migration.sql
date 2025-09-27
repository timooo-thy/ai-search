/*
  Warnings:

  - You are about to drop the column `data_repositories_names` on the `part` table. All the data in the column will be lost.
  - You are about to drop the column `data_respositories_ids` on the `part` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."part" DROP COLUMN "data_repositories_names",
DROP COLUMN "data_respositories_ids",
ADD COLUMN     "data_repositories_details" JSONB,
ADD COLUMN     "data_repositories_id" TEXT;
