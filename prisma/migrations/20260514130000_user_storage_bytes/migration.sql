-- Quota stockage par utilisateur (cumulé UploadThing).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "storageBytes" BIGINT NOT NULL DEFAULT 0;
