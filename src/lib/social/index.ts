import { prisma } from "@/lib/prisma"
import { updatePostStatus } from "@/lib/db/posts"

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

  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId, platform: { in: post.platforms } },
  })

  const results: PublishResult[] = []

  for (const platform of post.platforms) {
    const account = socialAccounts.find((a) => a.platform === platform)

    if (!account) {
      results.push({
        platform,
        success: false,
        error: "Account not connected",
      })
      continue
    }

    // Publication sur les réseaux sociaux pas encore implémentée.
    // Le post est sauvegardé en brouillon jusqu'à l'intégration des APIs.
    results.push({
      platform,
      success: false,
      error: "Publication directe bientôt disponible",
    })
  }

  await updatePostStatus(postId, "DRAFT", undefined)

  return results
}
