import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPostById, deletePost } from "@/lib/db/posts"
import { prisma } from "@/lib/prisma"
import { normalizePlatformId, normalizePlatformIds } from "@/lib/platforms"
import {
  isMediaValidationError,
  parseAndValidateMediaUrlList,
} from "@/lib/uploads/validation"

// GET /api/posts/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const post = await getPostById(id, session.user.id)
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  return NextResponse.json(post)
}

// PATCH /api/posts/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const post = await getPostById(id, session.user.id)
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const body = await req.json()
  const { content, platforms, scheduledAt, mediaUrls, status } = body

  let platformsNormalized: string[] | undefined
  if (Array.isArray(platforms)) {
    if (!platforms.every((p: unknown) => typeof p === "string")) {
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
    const np = normalizePlatformIds(platforms)
    if (np.length === 0) {
      return NextResponse.json(
        { error: "Au moins une plateforme valide est requise." },
        { status: 400 }
      )
    }
    platformsNormalized = np
  }

  // Le client peut seulement passer un post de PUBLISHED → DRAFT (annuler la publication)
  // ou rester sur DRAFT/SCHEDULED. Toute transition vers PUBLISHED/FAILED est réservée
  // au pipeline serveur (publishPost).
  let nextStatus: "DRAFT" | "SCHEDULED" | undefined
  if (status === "DRAFT" || status === "SCHEDULED") {
    nextStatus = status
  }

  let mediaUrlsPayload: string[] | undefined
  if (Array.isArray(mediaUrls)) {
    try {
      mediaUrlsPayload = parseAndValidateMediaUrlList(mediaUrls)
    } catch (e) {
      if (isMediaValidationError(e)) {
        return NextResponse.json(
          { error: e.message, code: e.code },
          { status: 400 }
        )
      }
      throw e
    }
  }

  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...(typeof content === "string" ? { content } : {}),
      ...(platformsNormalized !== undefined ? { platforms: platformsNormalized } : {}),
      ...(scheduledAt !== undefined
        ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
        : {}),
      ...(mediaUrlsPayload !== undefined ? { mediaUrls: mediaUrlsPayload } : {}),
      ...(nextStatus ? { status: nextStatus } : {}),
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/posts/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await deletePost(id, session.user.id)
  return NextResponse.json({ success: true })
}
