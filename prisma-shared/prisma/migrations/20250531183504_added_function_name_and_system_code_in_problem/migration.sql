/*
  Warnings:

  - Added the required column `functionName` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `systemCode` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
/*
  Warnings:

  - Added the required column `functionName` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `systemCode` to the `Problem` table without a default value. This is not possible if the table is not empty.
*/

-- Step 1: Add the columns as nullable
ALTER TABLE "Problem" 
ADD COLUMN "functionName" TEXT,
ADD COLUMN "systemCode" TEXT;

-- Step 2: Update existing rows with placeholder or computed values
UPDATE "Problem" 
SET "functionName" = 'unknown_function', 
    "systemCode" = 'unknown_code'
WHERE "functionName" IS NULL OR "systemCode" IS NULL;

-- Step 3: Make the columns non-nullable
ALTER TABLE "Problem" 
ALTER COLUMN "functionName" SET NOT NULL,
ALTER COLUMN "systemCode" SET NOT NULL;
