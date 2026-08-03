/*
  Warnings:

  - A unique constraint covering the columns `[tradeId,reviewerId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_postId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_postId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Review_tradeId_reviewerId_key" ON "Review"("tradeId", "reviewerId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
