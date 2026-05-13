import { prisma } from "@/lib/prisma"
import type { Post, PostStatus } from "@prisma/client"
import type { Prisma } from "@prisma/client"

/** Aligné sur la fenêtre de reclaim dans claimPostForPublishing (cron + API). */
export const PUBLISH_STALE_PROCESSING_MS = 15 * 60 * 1000

const STALE_PROCESSING_MS = PUBLISH_STALE_PROCESSING_MS

export type PublishClaimSource = "cron" | "api"

export type PublishClaimResult =
  | { kind: "claimed"; post: Post }
  | { kind: "already_published"; post: Post }
  | { kind: "in_progress"; post: Post }
  | { kind: "not_eligible" }

/**
 * Transition atomique vers PROCESSING pour un seul worker (updateMany).
 * Anti double-publish entre crons concurrents ou cron + API.
 */
export async function claimPostForPublishing(
  postId: string,
  userId: string,
  source: PublishClaimSource,
  now: Date = new Date()
): Promise<PublishClaimResult> {
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS)

  const existing = await prisma.post.findFirst({ where: { id: postId, userId } })
  if (!existing) return { kind: "not_eligible" }
  if (existing.status === "PUBLISHED") return { kind: "already_published", post: existing }

  if (existing.status === "PROCESSING" && existing.processingStartedAt != null) {
    if (existing.processingStartedAt.getTime() > staleBefore.getTime()) {
      return { kind: "in_progress", post: existing }
    }
  }

  const where: Prisma.PostWhereInput =
    source === "cron"
      ? {
          id: postId,
          userId,
          OR: [
            { status: "SCHEDULED", scheduledAt: { lte: now } },
            {
              status: "PROCESSING",
              OR: [
                { processingStartedAt: { lte: staleBefore } },
                { processingStartedAt: null, updatedAt: { lte: staleBefore } },
              ],
            },
          ],
        }
      : {
          id: postId,
          userId,
          OR: [
            { status: { in: ["DRAFT", "SCHEDULED", "FAILED"] } },
            {
              status: "PROCESSING",
              OR: [
                { processingStartedAt: { lte: staleBefore } },
                { processingStartedAt: null, updatedAt: { lte: staleBefore } },
              ],
            },
          ],
        }

  const n = await prisma.post.updateMany({
    where,
    data: {
      status: "PROCESSING",
      processingStartedAt: now,
      lastPublishAttemptAt: now,
      publishAttemptCount: { increment: 1 },
    },
  })

  if (n.count !== 1) {
    const again = await prisma.post.findFirst({ where: { id: postId, userId } })
    if (!again) return { kind: "not_eligible" }
    if (again.status === "PUBLISHED") return { kind: "already_published", post: again }
    if (
      again.status === "PROCESSING" &&
      again.processingStartedAt != null &&
      again.processingStartedAt.getTime() > staleBefore.getTime()
    ) {
      return { kind: "in_progress", post: again }
    }
    return { kind: "not_eligible" }
  }

  const post = await prisma.post.findFirst({ where: { id: postId, userId } })
  if (!post) return { kind: "not_eligible" }
  return { kind: "claimed", post }
}

interface GetPostsOptions {
  status?: PostStatus
  limit?: number
  offset?: number
}

export async function getUserPosts(
  userId: string,
  options: GetPostsOptions = {}
) {
  const { status, limit = 50, offset = 0 } = options

  return prisma.post.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: limit,
    skip: offset,
    select: {
      id: true,
      content: true,
      platforms: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      mediaUrls: true,
      createdAt: true,
    },
  })
}

export async function getPostById(postId: string, userId: string) {
  return prisma.post.findFirst({
    where: { id: postId, userId },
  })
}

export async function createPost(
  userId: string,
  data: {
    content: string
    platforms: string[]
    scheduledAt?: Date
    mediaUrls?: string[]
    status?: PostStatus
  }
) {
  return prisma.post.create({
    data: {
      userId,
      content: data.content,
      platforms: data.platforms,
      scheduledAt: data.scheduledAt,
      mediaUrls: data.mediaUrls ?? [],
      status: data.status ?? "DRAFT",
    },
  })
}

export async function updatePostStatus(
  postId: string,
  status: PostStatus,
  error?: string | null
) {
  const terminalClear =
    status === "PUBLISHED" || status === "FAILED"
      ? { processingStartedAt: null }
      : {}

  return prisma.post.update({
    where: { id: postId },
    data: {
      status,
      ...terminalClear,
      ...(status === "PUBLISHED"
        ? { publishedAt: new Date(), error: null }
        : status === "FAILED"
          ? { error: error ?? "Publication échouée." }
          : error != null && error !== ""
            ? { error }
            : {}),
    },
  })
}

export async function deletePost(postId: string, userId: string) {
  return prisma.post.deleteMany({
    where: { id: postId, userId },
  })
}
