/*
  Warnings:

  - You are about to drop the column `moderationRationale` on the `TradeOffer` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ReportReason" ADD VALUE 'AUTO_SCREENING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TargetType" ADD VALUE 'TRADE_OFFER';
ALTER TYPE "TargetType" ADD VALUE 'REVIEW';
ALTER TYPE "TargetType" ADD VALUE 'TRADE_REQUEST';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "isPendingScreening" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "offerId" INTEGER,
ADD COLUMN     "reviewId" INTEGER,
ADD COLUMN     "tradeRequestId" INTEGER;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "isPendingScreening" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRemoved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TradeOffer" DROP COLUMN "moderationRationale",
ADD COLUMN     "isRemoved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TradeRequest" ADD COLUMN     "isPendingScreening" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRemoved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPendingScreening" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pendingBio" TEXT;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "TradeOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_tradeRequestId_fkey" FOREIGN KEY ("tradeRequestId") REFERENCES "TradeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
