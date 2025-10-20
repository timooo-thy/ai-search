-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."message_part_type" ADD VALUE 'tool_codeGraph';
ALTER TYPE "public"."message_part_type" ADD VALUE 'data_codeGraph';

-- AlterTable
ALTER TABLE "public"."part" ADD COLUMN     "data_codeGraph" JSONB,
ADD COLUMN     "data_codeGraph_id" TEXT,
ADD COLUMN     "tool_codeGraph_input" JSONB,
ADD COLUMN     "tool_codeGraph_output" JSONB;
