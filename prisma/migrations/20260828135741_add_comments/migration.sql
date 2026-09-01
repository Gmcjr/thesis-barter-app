-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_RECIEVED';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "isPendingScreening" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRemoved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "commentId" INTEGER;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
