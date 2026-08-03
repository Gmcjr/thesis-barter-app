-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_postId_fkey";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "images" TEXT[],
ADD COLUMN     "isComplete" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
