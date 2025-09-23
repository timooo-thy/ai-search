/*
  Warnings:

  - The `data_weather_weather` column on the `part` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."weather" AS ENUM ('Thunderstorm', 'Drizzle', 'Rain', 'Snow', 'Mist', 'Smoke', 'Haze', 'Dust', 'Fog', 'Sand', 'Ash', 'Squall', 'Tornado', 'Clear', 'Clouds', 'Unknown');

-- AlterTable
ALTER TABLE "public"."part" DROP COLUMN "data_weather_weather",
ADD COLUMN     "data_weather_weather" "public"."weather";
