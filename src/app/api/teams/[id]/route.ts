import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageTeam, getUserTeamRole } from "@/lib/team"
import { logger } from "@/lib/logger"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const role = await getUserTeamRole(session.user.id, id)
  if (role === "none") {
    return NextResponse.json({ error: "Équipe introuvable." }, { status: 404 })
  }

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      invitations: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      },
      clients: { orderBy: { createdAt: "desc" } },
    },
  })

  return NextResponse.json({ team, role })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const role = await getUserTeamRole(session.user.id, id)
  if (!canManageTeam(role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 })
  }

  let body: { name?: unknown }
  try {
    body = (await req.json()) as { name?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }

  const data: { name?: string } = {}
  if (typeof body.name === "string") {
    const name = body.name.trim()
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: "Le nom de l'équipe doit faire entre 2 et 80 caractères." },
        { status: 400 }
      )
    }
    data.name = name
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 })
  }

  const team = await prisma.team.update({ where: { id }, data })
  logger.info("teams.updated", { route: `/api/teams/${id}`, userId: session.user.id, teamId: id })
  return NextResponse.json(team)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const role = await getUserTeamRole(session.user.id, id)
  if (role !== "owner") {
    return NextResponse.json({ error: "Seul le propriétaire peut supprimer l'équipe." }, { status: 403 })
  }
  await prisma.team.delete({ where: { id } })
  logger.info("teams.deleted", { route: `/api/teams/${id}`, userId: session.user.id, teamId: id })
  return NextResponse.json({ success: true })
}
