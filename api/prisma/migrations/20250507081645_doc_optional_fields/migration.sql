-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "includeSummary" BOOLEAN NOT NULL DEFAULT false;
