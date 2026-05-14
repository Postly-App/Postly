import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageTeam, getUserTeamRole } from "@/lib/team"
import { logger } from "@/lib/logger"

async function authorizeForClient(userId: string, clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { teamId: true },
  })
  if (!client) return { error: "Client introuvable." as const, status: 404, teamId: null, role: null }
  const role = await getUserTeamRole(userId, client.teamId)
  if (role === "none") {
    return { error: "Accès refusé." as const, status: 403, teamId: client.teamId, role }
  }
  return { teamId: client.teamId, role, error: null, status: 200 }
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
  const check = await authorizeForClient(session.user.id, id)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })
  if (!canManageTeam(check.role!)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 })
  }

  let body: { name?: unknown; brandColor?: unknown; logoUrl?: unknown }
  try {
    body = (await req.json()) as { name?: unknown; brandColor?: unknown; logoUrl?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }

  const data: { name?: string; brandColor?: string | null; logoUrl?: string | null } = {}
  if (typeof body.name === "string") {
    const name = body.name.trim()
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Nom du client invalide." }, { status: 400 })
    }
    data.name = name
  }
  if (body.brandColor === null) data.brandColor = null
  else if (typeof body.brandColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.brandColor)) {
    data.brandColor = body.brandColor
  }
  if (body.logoUrl === null) data.logoUrl = null
  else if (typeof body.logoUrl === "string" && body.logoUrl.startsWith("https://")) {
    data.logoUrl = body.logoUrl.slice(0, 500)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 })
  }

  const client = await prisma.client.update({ where: { id }, data })
  return NextResponse.json(client)
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
  const check = await authorizeForClient(session.user.id, id)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })
  if (!canManageTeam(check.role!)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 })
  }
  await prisma.client.delete({ where: { id } })
  logger.info("clients.deleted", { route: `/api/clients/${id}`, userId: session.user.id, clientId: id })
  return NextResponse.json({ success: true })
}
