import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserPosts, createPost } from "@/lib/db/posts"
import type { PostStatus } from "@prisma/client"
import { normalizePlatformId, normalizePlatformIds } from "@/lib/platforms"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")?.toUpperCase() as
    | PostStatus
    | undefined

  const posts = await getUserPosts(session.user.id, { status, limit: 50 })
  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { content, platforms, scheduledAt, mediaUrls } = body

    if (!content || !platforms?.length) {
      return NextResponse.json(
        { error: "Content et platforms sont requis." },
        { status: 400 }
      )
    }

    if (!Array.isArray(platforms) || !platforms.every((p) => typeof p === "string")) {
      return NextResponse.json(
        { error: "platforms doit être un tableau de chaînes." },
        { status: 400 }
      )
    }

    for (const p of platforms) {
      if (!normalizePlatformId(p)) {
        return NextResponse.json(
          { error: `Plateforme non supportée : ${p}` },
          { status: 400 }
        )
      }
    }

    const normalizedPlatforms = normalizePlatformIds(platforms)
    if (normalizedPlatforms.length === 0) {
      return NextResponse.json(
        { error: "Au moins une plateforme valide est requise." },
        { status: 400 }
      )
    }

    const post = await createPost(session.user.id, {
      content,
      platforms: normalizedPlatforms,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      mediaUrls,
      status: scheduledAt ? "SCHEDULED" : "DRAFT",
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("[POST /api/posts]", error)
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 })
  }
}
