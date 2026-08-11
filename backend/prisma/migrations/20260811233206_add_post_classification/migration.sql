-- CreateEnum
CREATE TYPE "MatchLevel" AS ENUM ('STRONG', 'GOOD', 'STRETCH', 'NOT_RELEVANT');

-- AlterTable
ALTER TABLE "telegram_posts" ADD COLUMN     "classifiedAt" TIMESTAMP(3),
ADD COLUMN     "matchLevel" "MatchLevel";
