/**
 * Identifiants canoniques des plateformes (MAJUSCULES).
 * Source unique pour Post.platforms, SocialAccount.platform et la logique métier.
 */
export const PLATFORM_IDS = [
  "INSTAGRAM",
  "TIKTOK",
  "TWITTER",
  "LINKEDIN",
  "YOUTUBE",
  "FACEBOOK",
  "THREADS",
  "PINTEREST",
  "BLUESKY",
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

const CANONICAL_SET = new Set<string>(PLATFORM_IDS);

const LOWER_TO_CANON: Record<string, PlatformId> = Object.fromEntries(
  PLATFORM_IDS.map((id) => [id.toLowerCase(), id])
) as Record<string, PlatformId>;

/**
 * Clés à utiliser dans les `where` Prisma pour couvrir d’éventuelles lignes legacy.
 * Les écritures doivent toujours utiliser l’identifiant canonique (MAJUSCULES).
 */
export function platformStorageKeys(canonical: PlatformId): string[] {
  const lower = canonical.toLowerCase();
  return lower === canonical ? [canonical] : [canonical, lower];
}

export function normalizePlatformId(raw: string): PlatformId | null {
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower === "x") return "TWITTER";
  const upper = t.toUpperCase();
  if (CANONICAL_SET.has(upper)) return upper as PlatformId;
  if (LOWER_TO_CANON[lower]) return LOWER_TO_CANON[lower];
  if (upper === "X" || upper === "TWITTERX") return "TWITTER";
  return null;
}

export function normalizePlatformIds(raw: unknown[]): PlatformId[] {
  const seen = new Set<PlatformId>();
  const out: PlatformId[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const n = normalizePlatformId(item);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}
