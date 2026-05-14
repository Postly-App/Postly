-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- POSTLY — Script de baseline + nouvelles migrations
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- À EXÉCUTER UNE SEULE FOIS dans Supabase → SQL Editor → New Query.
--
-- Ce script :
--   1. Crée la table _prisma_migrations si elle n'existe pas (baseline)
--   2. Marque l'ancienne migration (post_processing_publish_audit) comme
--      "déjà appliquée" — elle l'a été via db push initialement.
--   3. Applique les 2 nouvelles migrations AGENCY + storageBytes
--      uniquement si elles ne sont pas encore appliquées (idempotent).
--
-- Après ce script, tu pourras réactiver `prisma migrate deploy` dans le
-- build Vercel pour les futures migrations.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. Table de tracking Prisma
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) PRIMARY KEY,
    "checksum"              VARCHAR(64) NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. Marquer l'ancienne migration comme appliquée
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    'baseline-existing-schema',
    now(),
    '20260513180000_post_processing_publish_audit',
    now(),
    1
)
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. Migration AGENCY — Teams, Members, Invitations, Clients, ApiKeys
-- (idempotent : utilise IF NOT EXISTS partout)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$ BEGIN
    CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "Team_ownerId_idx" ON "Team"("ownerId");

CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "invitedBy" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");
CREATE INDEX IF NOT EXISTS "TeamMember_userId_idx" ON "TeamMember"("userId");

CREATE TABLE IF NOT EXISTS "TeamInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "TeamInvitation_token_key" ON "TeamInvitation"("token");
CREATE INDEX IF NOT EXISTS "TeamInvitation_email_idx" ON "TeamInvitation"("email");
CREATE INDEX IF NOT EXISTS "TeamInvitation_teamId_idx" ON "TeamInvitation"("teamId");

CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandColor" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "Client" ADD CONSTRAINT "Client_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "Client_teamId_idx" ON "Client"("teamId");

CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_hashedKey_key" ON "ApiKey"("hashedKey");
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_prefix_idx" ON "ApiKey"("prefix");

-- Post.clientId
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

DO $$ BEGIN
    ALTER TABLE "Post" ADD CONSTRAINT "Post_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "Post_clientId_idx" ON "Post"("clientId");

-- SocialAccount.clientId
ALTER TABLE "SocialAccount" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

DO $$ BEGIN
    ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "SocialAccount_clientId_idx" ON "SocialAccount"("clientId");

-- Marquer la migration comme appliquée
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
SELECT gen_random_uuid()::text, 'manual-supabase-apply', now(), '20260514120000_agency_teams_clients_apikeys', now(), 1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20260514120000_agency_teams_clients_apikeys'
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. Migration User.storageBytes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "storageBytes" BIGINT NOT NULL DEFAULT 0;

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
SELECT gen_random_uuid()::text, 'manual-supabase-apply', now(), '20260514130000_user_storage_bytes', now(), 1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20260514130000_user_storage_bytes'
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Vérification finale (à inspecter visuellement après l'exécution)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at;
SELECT 'Team' AS table_name, count(*) FROM "Team"
UNION ALL SELECT 'Client', count(*) FROM "Client"
UNION ALL SELECT 'ApiKey', count(*) FROM "ApiKey";
