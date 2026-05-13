import type { SocialAccount } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { updatePostStatus } from "@/lib/db/posts"
import { normalizePlatformId, type PlatformId } from "@/lib/platforms"
import type { PublishContext, PublishResult } from "../types"
import { publishTwitter } from "./providers/twitter"
import { publishFacebookPage } from "./providers/facebook"
import { publishLinkedInMember } from "./providers/linkedin"
import { publishInstagramBusiness } from "./providers/instagram"
import { publishThreads } from "./providers/threads"

const AUTO_PUBLISH_PLATFORMS: ReadonlySet<PlatformId> = new Set([
  "TWITTER",
  "LINKEDIN",
  "FACEBOOK",
  "INSTAGRAM",
  "THREADS",
])

function toReadableError(e: unknown): string {
  if (e instanceof Error) return e.message
  return "Erreur inconnue lors de la publication."
}

async function runPlatformPublish(
  platform: PlatformId,
  account: SocialAccount,
  ctx: PublishContext
): Promise<{ remoteId: string }> {
  switch (platform) {
    case "TWITTER":
      return publishTwitter(account, ctx)
    case "FACEBOOK":
      return publishFacebookPage(account, ctx)
    case "LINKEDIN":
      return publishLinkedInMember(account, ctx)
    case "INSTAGRAM":
      return publishInstagramBusiness(account, ctx)
    case "THREADS":
      return publishThreads(account, ctx)
    default:
      throw new Error(`Publication automatique non prise en charge pour ${platform}.`)
  }
}

/**
 * Publie un post sur les réseaux ciblés. Met à jour le statut du post uniquement vers
 * `PUBLISHED` (100 % de succès) ou `FAILED` (sinon). Ne renvoie jamais le post en `DRAFT`.
 */
export async function publishPost(postId: string, userId: string): Promise<PublishResult[]> {
  const post = await prisma.post.findFirst({
    where: { id: postId, userId },
  })

  if (!post) throw new Error("Post not found")

  if (!post.platforms?.length) {
    const msg =
      "Aucune plateforme ciblée : impossible de publier. Ajoutez au moins un réseau au post."
    await updatePostStatus(postId, "FAILED", msg)
    return [
      {
        platform: "—",
        canonicalPlatform: null,
        success: false,
        error: msg,
      },
    ]
  }

  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  })

  const accountsByCanon = new Map<PlatformId, (typeof socialAccounts)[number]>()
  for (const a of socialAccounts) {
    const canon = normalizePlatformId(a.platform)
    if (canon && !accountsByCanon.has(canon)) {
      accountsByCanon.set(canon, a)
    }
  }

  const ctx: PublishContext = {
    postId,
    userId,
    content: post.content,
    mediaUrls: post.mediaUrls ?? [],
  }

  const results: PublishResult[] = []

  for (const platformRaw of post.platforms) {
    const canon = normalizePlatformId(platformRaw)
    if (!canon) {
      results.push({
        platform: platformRaw,
        canonicalPlatform: null,
        success: false,
        error: `Plateforme inconnue ou non supportée : « ${platformRaw} ».`,
      })
      continue
    }

    if (!AUTO_PUBLISH_PLATFORMS.has(canon)) {
      results.push({
        platform: platformRaw,
        canonicalPlatform: canon,
        success: false,
        error: `La publication automatique n’est pas encore activée pour ${canon}. Utilisez une intégration manuelle ou un autre réseau.`,
      })
      continue
    }

    const account = accountsByCanon.get(canon)
    if (!account) {
      results.push({
        platform: platformRaw,
        canonicalPlatform: canon,
        success: false,
        error: `Aucun compte ${canon} connecté. Connectez le réseau dans les paramètres.`,
      })
      continue
    }

    try {
      const { remoteId } = await runPlatformPublish(canon, account, ctx)
      results.push({
        platform: platformRaw,
        canonicalPlatform: canon,
        success: true,
        remoteId,
      })
    } catch (e) {
      results.push({
        platform: platformRaw,
        canonicalPlatform: canon,
        success: false,
        error: toReadableError(e),
      })
    }
  }

  const allSuccess = results.length > 0 && results.every((r) => r.success)
  if (allSuccess) {
    await updatePostStatus(postId, "PUBLISHED")
  } else {
    const detail = results
      .filter((r) => !r.success)
      .map((r) => `${r.canonicalPlatform ?? r.platform} : ${r.error ?? "échec"}`)
      .join(" · ")
    await updatePostStatus(
      postId,
      "FAILED",
      detail.slice(0, 4000) || "Publication échouée sur une ou plusieurs plateformes."
    )
  }

  return results
}
