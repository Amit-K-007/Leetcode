/*
  Warnings:

  - A unique constraint covering the columns `[titleSlug]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Problem_titleSlug_key" ON "Problem"("titleSlug");
