/*
  Warnings:

  - You are about to drop the column `isComplete` on the `Post` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,type]` on the table `Cat` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Cat_name_key";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "isComplete";

-- CreateIndex
CREATE UNIQUE INDEX "Cat_name_type_key" ON "Cat"("name", "type");
