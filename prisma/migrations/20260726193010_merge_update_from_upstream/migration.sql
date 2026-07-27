-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_postId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_postId_fkey";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
