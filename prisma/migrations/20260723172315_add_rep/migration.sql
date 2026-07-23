-- CreateTable
CREATE TABLE "Rep" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Rep_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rep" ADD CONSTRAINT "Rep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
