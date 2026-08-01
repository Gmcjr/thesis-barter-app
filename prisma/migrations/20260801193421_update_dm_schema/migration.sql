/*
  Warnings:

  - A unique constraint covering the columns `[user1Id,user2Id]` on the table `DM` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "DM_user1Id_user2Id_key" ON "DM"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Message_dmId_createdAt_idx" ON "Message"("dmId", "createdAt");
