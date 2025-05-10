-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fileMeta" JSONB,
ALTER COLUMN "originalPath" DROP NOT NULL;
