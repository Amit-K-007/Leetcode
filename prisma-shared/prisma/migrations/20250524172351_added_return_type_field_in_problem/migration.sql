/*
  Warnings:

  - Added the required column `returnType` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Step 1: Add column as nullable
ALTER TABLE "Problem" ADD COLUMN "returnType" TEXT;

-- Step 2: Fill default value for existing rows
UPDATE "Problem" SET "returnType" = 'string'; -- or whatever makes sense

-- Step 3: Make column NOT NULL
ALTER TABLE "Problem" ALTER COLUMN "returnType" SET NOT NULL;
