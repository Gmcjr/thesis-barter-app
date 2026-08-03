-- DropIndex
DROP INDEX "Trade_postId_key";

-- CreateIndex
CREATE INDEX "Trade_postId_idx" ON "Trade"("postId");
