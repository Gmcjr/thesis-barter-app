/*
  Warnings:

  - You are about to drop the column `ownerCompl` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `reqCompl` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `postId` on the `Review` table. All the data in the column will be lost.
  - Added the required column `tradeId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_postId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "ownerCompl",
DROP COLUMN "reqCompl";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "postId",
ADD COLUMN     "tradeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "ownerCompl" BOOLEAN NOT NULL DEFAULT false,
    "reqCompl" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trade_postId_key" ON "Trade"("postId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
