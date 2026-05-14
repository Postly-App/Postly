import { createHash, randomBytes } from "crypto"
import type { User } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const PREFIX = "pk_"
const PREFIX_DISPLAY_LEN = 8

/**
 * Génère une clé API : `pk_<32 bytes base64url>`. Stocke uniquement le SHA-256.
 * Le user voit la clé en clair UNE seule fois à la création.
 */
export function generateApiKey(): { key: string; prefix: string; hashed: string } {
  const raw = randomBytes(32).toString("base64url")
  const key = `${PREFIX}${raw}`
  const prefix = key.slice(0, PREFIX_DISPLAY_LEN)
  const hashed = createHash("sha256").update(key).digest("hex")
  return { key, prefix, hashed }
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

/**
 * Résout une clé API → user. Met à jour lastUsedAt en best-effort.
 * Retourne null si invalide / expirée.
 */
export async function authenticateApiKey(rawKey: string): Promise<User | null> {
  if (!rawKey.startsWith(PREFIX)) return null
  const hashed = hashApiKey(rawKey)
  const found = await prisma.apiKey.findUnique({
    where: { hashedKey: hashed },
    include: { user: true },
  })
  if (!found) return null
  if (found.expiresAt && found.expiresAt.getTime() < Date.now()) return null

  // best-effort, ne bloque pas
  prisma.apiKey
    .update({ where: { id: found.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {})

  return found.user
}

/**
 * Extrait la clé d'un header Authorization "Bearer pk_xxx".
 */
export function extractApiKeyFromHeader(header: string | null): string | null {
  if (!header) return null
  const m = /^Bearer\s+(pk_[A-Za-z0-9_-]+)\s*$/i.exec(header)
  return m?.[1] ?? null
}
