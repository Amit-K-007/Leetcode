-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "paramName" TEXT[] DEFAULT ARRAY[]::TEXT[];
