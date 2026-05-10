import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPostById, deletePost } from "@/lib/db/posts"
import { prisma } from "@/lib/prisma"

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

  // Le client peut seulement passer un post de PUBLISHED → DRAFT (annuler la publication)
  // ou rester sur DRAFT/SCHEDULED. Toute transition vers PUBLISHED/FAILED est réservée
  // au pipeline serveur (publishPost).
  let nextStatus: "DRAFT" | "SCHEDULED" | undefined
  if (status === "DRAFT" || status === "SCHEDULED") {
    nextStatus = status
  }

  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...(typeof content === "string" ? { content } : {}),
      ...(Array.isArray(platforms) ? { platforms } : {}),
      ...(scheduledAt !== undefined
        ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }
        : {}),
      ...(Array.isArray(mediaUrls) ? { mediaUrls } : {}),
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
