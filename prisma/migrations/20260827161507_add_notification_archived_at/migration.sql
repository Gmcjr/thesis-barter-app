-- DropIndex
DROP INDEX "Notification_userId_readAt_createdAt_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Notification_userId_archivedAt_createdAt_idx" ON "Notification"("userId", "archivedAt", "createdAt");
