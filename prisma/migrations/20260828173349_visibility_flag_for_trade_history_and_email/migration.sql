-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tradeHistoryVisible" BOOLEAN NOT NULL DEFAULT true;
