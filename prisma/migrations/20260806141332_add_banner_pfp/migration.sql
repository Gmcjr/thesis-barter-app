/*
  Warnings:

  - A unique constraint covering the columns `[userId,slot]` on the table `UserMedia` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slot` to the `UserMedia` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserMediaSlot" AS ENUM ('AVATAR', 'BANNER');

-- DropIndex
DROP INDEX "UserMedia_mediaId_userId_key";

-- AlterTable
ALTER TABLE "UserMedia" ADD COLUMN     "slot" "UserMediaSlot" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserMedia_userId_slot_key" ON "UserMedia"("userId", "slot");
