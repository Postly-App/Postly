import { prisma } from "@/lib/prisma"
import { updatePostStatus } from "@/lib/db/posts"
import { normalizePlatformId, type PlatformId } from "@/lib/platforms"

interface PublishResult {
  platform: string
  success: boolean
  error?: string
}

export async function publishPost(
  postId: string,
  userId: string
): Promise<PublishResult[]> {
  const post = await prisma.post.findFirst({
    where: { id: postId, userId },
  })

  if (!post) throw new Error("Post not found")

  if (post.platforms.length === 0) {
    await updatePostStatus(postId, "FAILED", "Aucune plateforme ciblée.")
    return []
  }

  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId },
  })

  const accountsByCanon = new Map<PlatformId, (typeof socialAccounts)[number]>()
  for (const a of socialAccounts) {
    const canon = normalizePlatformId(a.platform)
    if (canon && !accountsByCanon.has(canon)) {
      accountsByCanon.set(canon, a)
    }
  }

  const results: PublishResult[] = []

  for (const platform of post.platforms) {
    const canon = normalizePlatformId(platform)
    const account = canon ? accountsByCanon.get(canon) : undefined

    if (!account) {
      results.push({
        platform,
        success: false,
        error: "Account not connected",
      })
      continue
    }

    // Publication sur les réseaux sociaux pas encore implémentée.
    results.push({
      platform,
      success: false,
      error: "Publication directe bientôt disponible",
    })
  }

  const allOk = results.every((r) => r.success)
  if (allOk) {
    await updatePostStatus(postId, "PUBLISHED")
  } else {
    const detail = results
      .filter((r) => !r.success)
      .map((r) => `${r.platform}: ${r.error ?? "échec"}`)
      .join(" · ")
    await updatePostStatus(
      postId,
      "FAILED",
      detail.slice(0, 4000) || "Publication échouée."
    )
  }

  return results
}
