/*
  Warnings:

  - The values [tool_getLocation] on the enum `message_part_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."message_part_type_new" AS ENUM ('text', 'reasoning', 'file', 'source_url', 'source_document', 'step_start', 'tool_getWeatherInformation', 'tool_getRepositories', 'data_weather', 'data_repositories');
ALTER TABLE "public"."part" ALTER COLUMN "type" TYPE "public"."message_part_type_new" USING ("type"::text::"public"."message_part_type_new");
ALTER TYPE "public"."message_part_type" RENAME TO "message_part_type_old";
ALTER TYPE "public"."message_part_type_new" RENAME TO "message_part_type";
DROP TYPE "public"."message_part_type_old";
COMMIT;

-- RenameIndex
ALTER INDEX "public"."chat_id_userId_key" RENAME TO "chat_id_user_id_key";
