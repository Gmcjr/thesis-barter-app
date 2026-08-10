-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DM_MESSAGE', 'TRADE_OFFER_RECEIVED', 'TRADE_OFFER_ACCEPTED', 'TRADE_REQUEST_RECEIVED', 'TRADE_REQUEST_ACCEPTED', 'REVIEW_RECEIVED', 'CONTENT_SCREENED', 'REPORT_RESOLVED', 'APPEAL_RESOLVED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "entityType" TEXT,
    "entityId" INTEGER,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
