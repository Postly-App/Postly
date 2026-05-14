import { NextResponse } from "next/server"
import { authenticateApiKey, extractApiKeyFromHeader } from "@/lib/api-keys"
import { getUserActivePlan, PLAN_LIMITS, checkCanSchedulePost } from "@/lib/plan-limits"
import { normalizePlatformIds } from "@/lib/platforms"
import { createPost, getUserPosts } from "@/lib/db/posts"
import { parseAndValidateMediaUrlList, isMediaValidationError } from "@/lib/uploads/validation"
import { logger } from "@/lib/logger"
import type { PostStatus } from "@prisma/client"

async function authenticate(req: Request) {
  const rawKey = extractApiKeyFromHeader(req.headers.get("authorization"))
  if (!rawKey) return null
  const user = await authenticateApiKey(rawKey)
  if (!user) return null
  const plan = await getUserActivePlan(user.id)
  if (!PLAN_LIMITS[plan].publicApi) return null
  return user
}

export async function GET(req: Request) {
  const user = await authenticate(req)
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Use Bearer pk_... in Authorization header (AGENCY plan)." },
      { status: 401 }
    )
  }

  const url = new URL(req.url)
  const status = url.searchParams.get("status")?.toUpperCase() as PostStatus | undefined
  const limitRaw = Number(url.searchParams.get("limit") ?? "20")
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20))

  const posts = await getUserPosts(user.id, { status, limit })
  return NextResponse.json({
    data: posts.map((p) => ({
      id: p.id,
      content: p.content,
      platforms: p.platforms,
      mediaUrls: p.mediaUrls,
      status: p.status,
      scheduledAt: p.scheduledAt,
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
    })),
  })
}

export async function POST(req: Request) {
  const user = await authenticate(req)
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Use Bearer pk_... in Authorization header (AGENCY plan)." },
      { status: 401 }
    )
  }

  let body: {
    content?: unknown
    platforms?: unknown
    mediaUrls?: unknown
    scheduledAt?: unknown
    publishNow?: unknown
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content.trim() : ""
  if (content.length < 1 || content.length > 10000) {
    return NextResponse.json({ error: "content must be 1-10000 chars." }, { status: 400 })
  }
  if (!Array.isArray(body.platforms) || body.platforms.length === 0) {
    return NextResponse.json({ error: "platforms must be a non-empty array." }, { status: 400 })
  }
  const platforms = normalizePlatformIds(body.platforms)
  if (platforms.length === 0) {
    return NextResponse.json({ error: "No valid platform IDs." }, { status: 400 })
  }

  let mediaUrls: string[] | undefined
  if (body.mediaUrls !== undefined) {
    try {
      mediaUrls = parseAndValidateMediaUrlList(body.mediaUrls)
    } catch (e) {
      if (isMediaValidationError(e)) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: 400 })
      }
      throw e
    }
  }

  const scheduledAt =
    typeof body.scheduledAt === "string" && body.scheduledAt
      ? new Date(body.scheduledAt)
      : undefined
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledAt (ISO 8601 expected)." }, { status: 400 })
  }

  if (scheduledAt) {
    const check = await checkCanSchedulePost(user.id)
    if (!check.allowed) {
      return NextResponse.json(
        { error: check.reason, code: "PLAN_LIMIT_REACHED", limit: check.limit, current: check.current },
        { status: 402 }
      )
    }
  }

  const post = await createPost(user.id, {
    content,
    platforms,
    mediaUrls,
    scheduledAt,
    status: scheduledAt ? "SCHEDULED" : "DRAFT",
  })

  logger.info("api_v1.post_created", {
    route: "/api/v1/posts",
    userId: user.id,
    postId: post.id,
    via: "api_key",
  })

  return NextResponse.json(
    {
      data: {
        id: post.id,
        content: post.content,
        platforms: post.platforms,
        mediaUrls: post.mediaUrls,
        status: post.status,
        scheduledAt: post.scheduledAt,
        createdAt: post.createdAt,
      },
    },
    { status: 201 }
  )
}
