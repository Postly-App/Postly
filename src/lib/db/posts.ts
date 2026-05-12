import { prisma } from "@/lib/prisma"
import type { PostStatus } from "@prisma/client"

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
  return prisma.post.update({
    where: { id: postId },
    data: {
      status,
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
