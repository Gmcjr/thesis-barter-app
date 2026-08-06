-- AlterTable
ALTER TABLE "TradeOffer" ADD COLUMN     "isPendingScreening" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderationRationale" TEXT;
