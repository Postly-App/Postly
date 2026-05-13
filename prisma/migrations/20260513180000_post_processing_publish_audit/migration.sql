-- Verrou logique publication + observabilité (anti double-publish, reprise stale).
ALTER TYPE "PostStatus" ADD VALUE 'PROCESSING';

ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "processingStartedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "publishAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastPublishAttemptAt" TIMESTAMP(3);
