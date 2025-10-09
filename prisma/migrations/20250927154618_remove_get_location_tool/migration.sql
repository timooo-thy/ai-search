/*
  Warnings:

  - You are about to drop the column `tool_getLocation_input` on the `part` table. All the data in the column will be lost.
  - You are about to drop the column `tool_getLocation_output` on the `part` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."part" DROP COLUMN "tool_getLocation_input",
DROP COLUMN "tool_getLocation_output";
