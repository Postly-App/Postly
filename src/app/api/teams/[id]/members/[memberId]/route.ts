import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canManageTeam, getUserTeamRole } from "@/lib/team"
import { logger } from "@/lib/logger"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id: teamId, memberId } = await params
  const role = await getUserTeamRole(session.user.id, teamId)
  if (!canManageTeam(role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 })
  }

  let body: { role?: unknown }
  try {
    body = (await req.json()) as { role?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }
  const newRole = body.role === "ADMIN" ? "ADMIN" : body.role === "MEMBER" ? "MEMBER" : null
  if (!newRole) {
    return NextResponse.json({ error: "Rôle invalide (ADMIN ou MEMBER)." }, { status: 400 })
  }

  // Empêche de modifier le owner via les members (le owner n'a pas d'entrée TeamMember).
  const updated = await prisma.teamMember.updateMany({
    where: { id: memberId, teamId },
    data: { role: newRole },
  })
  if (updated.count === 0) {
    return NextResponse.json({ error: "Membre introuvable." }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id: teamId, memberId } = await params
  const role = await getUserTeamRole(session.user.id, teamId)
  if (!canManageTeam(role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 })
  }

  const deleted = await prisma.teamMember.deleteMany({
    where: { id: memberId, teamId },
  })
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Membre introuvable." }, { status: 404 })
  }
  logger.info("teams.member_removed", {
    route: `/api/teams/${teamId}/members/${memberId}`,
    userId: session.user.id,
    teamId,
  })
  return NextResponse.json({ success: true })
}
