-- AlterEnum
ALTER TYPE "public"."message_part_type" ADD VALUE 'data_repositories';

-- AlterTable
ALTER TABLE "public"."part" ADD COLUMN     "data_repositories_details" JSONB,
ADD COLUMN     "data_repositories_id" TEXT;
