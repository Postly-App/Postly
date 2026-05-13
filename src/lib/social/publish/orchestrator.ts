import type { SocialAccount } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  claimPostForPublishing,
  type PublishClaimSource,
  updatePostStatus,
} from "@/lib/db/posts"
import { normalizePlatformId, type PlatformId } from "@/lib/platforms"
import type { PublishContext, PublishResult } from "../types"
import { publishTwitter } from "./providers/twitter"
import { publishFacebookPage } from "./providers/facebook"
import { publishLinkedInMember } from "./providers/linkedin"
import { publishInstagramBusiness } from "./providers/instagram"
import { publishThreads } from "./providers/threads"
import {
  isSocialTokenCryptoError,
  safeSocialTokenErrorMessageForClient,
} from "../social-token-crypto"
import { logger } from "@/lib/logger"
import { publishErrorMeta } from "./retry-policy"
import { ConcurrentPublishInProgressError } from "./errors"

const AUTO_PUBLISH_PLATFORMS: ReadonlySet<PlatformId> = new Set([
  "TWITTER",
  "LINKEDIN",
  "FACEBOOK",
  "INSTAGRAM",
  "THREADS",
])

function toReadableError(e: unknown): string {
  if (isSocialTokenCryptoError(e)) {
    const safe = safeSocialTokenErrorMessageForClient(e)
    if (safe) return safe
  }
  if (e instanceof Error) return e.message
  return "Erreur inconnue lors de la publication."
}

function idempotentSkipResults(platforms: string[]): PublishResult[] {
  if (platforms.length === 0) {
    return [
      {
        platform: "—",
        canonicalPlatform: null,
        success: true,
        skipped: true,
        skipReason: "already_published",
      },
    ]
  }
  return platforms.map((platform) => ({
    platform,
    canonicalPlatform: normalizePlatformId(platform),
    success: true,
    skipped: true,
    skipReason: "already_published" as const,
  }))
}

function concurrentSkipResults(): PublishResult[] {
  return [
    {
      platform: "—",
      canonicalPlatform: null,
      success: true,
      skipped: true,
      skipReason: "concurrent_lock",
    },
  ]
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
 * Publie un post sur les réseaux ciblés. Verrou logique PROCESSING + updateMany atomique.
 * Statuts terminaux : PUBLISHED (100 % succès) ou FAILED. Jamais retour en DRAFT.
 */
export async function publishPost(
  postId: string,
  userId: string,
  options?: { source?: PublishClaimSource }
): Promise<PublishResult[]> {
  const source: PublishClaimSource = options?.source ?? "api"

  const claim = await claimPostForPublishing(postId, userId, source)

  if (claim.kind === "already_published") {
    logger.info("publish.idempotent_skip", {
      route: "publish:orchestrator",
      postId,
      userId,
      outcome: "already_published",
    })
    return idempotentSkipResults(claim.post.platforms ?? [])
  }

  if (claim.kind === "in_progress") {
    if (source === "api") {
      throw new ConcurrentPublishInProgressError()
    }
    logger.info("publish.concurrent_skip", {
      route: "publish:orchestrator",
      postId,
      userId,
      outcome: "cron_lock",
    })
    return concurrentSkipResults()
  }

  if (claim.kind === "not_eligible") {
    throw new Error("Post not found")
  }

  const post = claim.post

  try {
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
          retryable: false,
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
          retryable: false,
        })
        continue
      }

      if (!AUTO_PUBLISH_PLATFORMS.has(canon)) {
        results.push({
          platform: platformRaw,
          canonicalPlatform: canon,
          success: false,
          error: `La publication automatique n’est pas encore activée pour ${canon}. Utilisez une intégration manuelle ou un autre réseau.`,
          retryable: false,
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
          retryable: false,
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
        const meta = publishErrorMeta(e)
        logger.warn("publish.platform_failed", {
          route: "publish:orchestrator",
          action: "runPlatformPublish",
          postId,
          userId,
          platform: canon,
          err: e,
        })
        results.push({
          platform: platformRaw,
          canonicalPlatform: canon,
          success: false,
          error: toReadableError(e),
          ...meta,
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
  } catch (e) {
    await prisma.post.updateMany({
      where: { id: postId, userId, status: "PROCESSING" },
      data: {
        status: "FAILED",
        error:
          e instanceof Error
            ? e.message.slice(0, 4000)
            : "Publication interrompue (erreur inattendue).",
        processingStartedAt: null,
      },
    })
    throw e
  }
}
