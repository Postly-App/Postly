import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { publishPost, ConcurrentPublishInProgressError } from "@/lib/social"
import { logger } from "@/lib/logger"
import { enforceRateLimit } from "@/lib/ratelimit"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const publishBlock = await enforceRateLimit(
    "publishUser",
    `user:${session.user.id}`,
    "Limite de publications atteinte. Réessayez plus tard."
  )
  if (publishBlock) return publishBlock

  const { id } = await params

  try {
    const results = await publishPost(id, session.user.id)
    const success = results.length > 0 && results.every((r) => r.success)

    return NextResponse.json({
      success,
      results,
    })
  } catch (error) {
    if (error instanceof ConcurrentPublishInProgressError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    logger.error("api.posts.publish_failed", {
      route: "/api/posts/[id]/publish",
      action: "POST",
      postId: id,
      userId: session.user.id,
      err: error,
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur." },
      { status: 500 }
    )
  }
}
