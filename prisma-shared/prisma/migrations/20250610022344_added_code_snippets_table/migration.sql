-- CreateTable
CREATE TABLE "CodeSnippets" (
    "id" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "CodeSnippets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CodeSnippets" ADD CONSTRAINT "CodeSnippets_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
