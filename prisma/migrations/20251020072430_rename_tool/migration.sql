/*
  Warnings:

  - The values [tool_codeGraph] on the enum `message_part_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tool_codeGraph_input` on the `part` table. All the data in the column will be lost.
  - You are about to drop the column `tool_codeGraph_output` on the `part` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."message_part_type_new" AS ENUM ('text', 'reasoning', 'file', 'source_url', 'source_document', 'step_start', 'tool_getWeatherInformation', 'tool_getRepositories', 'tool_visualiseCodeGraph', 'data_weather', 'data_repositories', 'data_codeGraph');
ALTER TABLE "public"."part" ALTER COLUMN "type" TYPE "public"."message_part_type_new" USING ("type"::text::"public"."message_part_type_new");
ALTER TYPE "public"."message_part_type" RENAME TO "message_part_type_old";
ALTER TYPE "public"."message_part_type_new" RENAME TO "message_part_type";
DROP TYPE "public"."message_part_type_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."part" DROP COLUMN "tool_codeGraph_input",
DROP COLUMN "tool_codeGraph_output",
ADD COLUMN     "tool_visualiseCodeGraph_input" JSONB,
ADD COLUMN     "tool_visualiseCodeGraph_output" JSONB;
