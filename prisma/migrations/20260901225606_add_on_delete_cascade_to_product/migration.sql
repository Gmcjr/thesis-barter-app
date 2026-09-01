-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_postId_fkey";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
