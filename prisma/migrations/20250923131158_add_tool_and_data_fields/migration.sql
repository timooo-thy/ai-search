-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."message_part_type" ADD VALUE 'tool_getWeatherInformation';
ALTER TYPE "public"."message_part_type" ADD VALUE 'tool_getLocation';
ALTER TYPE "public"."message_part_type" ADD VALUE 'data_weather';

-- AlterTable
ALTER TABLE "public"."part" ADD COLUMN     "data_weather_id" TEXT,
ADD COLUMN     "data_weather_location" TEXT,
ADD COLUMN     "data_weather_temperature" DOUBLE PRECISION,
ADD COLUMN     "data_weather_weather" TEXT,
ADD COLUMN     "tool_errorText" TEXT,
ADD COLUMN     "tool_getLocation_input" JSONB,
ADD COLUMN     "tool_getLocation_output" JSONB,
ADD COLUMN     "tool_getWeatherInformation_input" JSONB,
ADD COLUMN     "tool_getWeatherInformation_output" JSONB,
ADD COLUMN     "tool_state" TEXT,
ADD COLUMN     "tool_toolCallId" TEXT;
