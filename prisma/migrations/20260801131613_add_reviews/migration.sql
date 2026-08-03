/*
  Warnings:

  - You are about to drop the column `isComplete` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the `Rep` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('OPEN', 'ACCEPTED', 'IN_PROGRESS', 'WAITING_FOR_OTHER_USER', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Rep" DROP CONSTRAINT "Rep_userId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "isComplete",
ADD COLUMN     "ownerCompl" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reqCompl" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'OPEN';

-- DropTable
DROP TABLE "Rep";

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "revieweeId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
