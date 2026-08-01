/*
  Warnings:

  - You are about to drop the column `message` on the `TradeOffer` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'GRANTED', 'DENIED');

-- AlterTable
ALTER TABLE "TradeOffer" DROP COLUMN "message";

-- CreateTable
CREATE TABLE "Appeal" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "appellantId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "resolverId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appeal_reportId_key" ON "Appeal"("reportId");

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_appellantId_fkey" FOREIGN KEY ("appellantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_resolverId_fkey" FOREIGN KEY ("resolverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
