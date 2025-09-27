/*
  Warnings:

  - The values [data_repositories] on the enum `message_part_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `data_repositories_details` on the `part` table. All the data in the column will be lost.
  - You are about to drop the column `data_repositories_id` on the `part` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."message_part_type_new" AS ENUM ('text', 'reasoning', 'file', 'source_url', 'source_document', 'step_start', 'tool_getWeatherInformation', 'tool_getLocation', 'tool_getRepositories', 'data_weather');
ALTER TABLE "public"."part" ALTER COLUMN "type" TYPE "public"."message_part_type_new" USING ("type"::text::"public"."message_part_type_new");
ALTER TYPE "public"."message_part_type" RENAME TO "message_part_type_old";
ALTER TYPE "public"."message_part_type_new" RENAME TO "message_part_type";
DROP TYPE "public"."message_part_type_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."part" DROP COLUMN "data_repositories_details",
DROP COLUMN "data_repositories_id";
