-- AlterTable
ALTER TABLE "events" ADD COLUMN     "honorees" TEXT[] DEFAULT ARRAY[]::TEXT[];
