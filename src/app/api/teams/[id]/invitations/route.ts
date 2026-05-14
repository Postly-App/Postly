import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  canManageTeam,
  checkCanInviteMember,
  generateInvitationToken,
  getUserTeamRole,
  INVITATION_TTL_MS,
} from "@/lib/team"
import { logger } from "@/lib/logger"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id: teamId } = await params

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  })
  if (!team) {
    return NextResponse.json({ error: "Équipe introuvable." }, { status: 404 })
  }
  const role = await getUserTeamRole(session.user.id, teamId)
  if (!canManageTeam(role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 })
  }

  let body: { email?: unknown; role?: unknown }
  try {
    body = (await req.json()) as { email?: unknown; role?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 })
  }
  const inviteRole = body.role === "ADMIN" ? "ADMIN" : "MEMBER"

  // Empêche de réinviter un membre déjà accepté
  const existingMember = await prisma.teamMember.findFirst({
    where: { teamId, user: { email } },
  })
  if (existingMember) {
    return NextResponse.json(
      { error: "Cet utilisateur est déjà membre de l'équipe." },
      { status: 409 }
    )
  }

  const check = await checkCanInviteMember(teamId, team.ownerId)
  if (!check.allowed) {
    return NextResponse.json(
      {
        error: check.reason,
        code: "PLAN_LIMIT_REACHED",
        current: check.current,
        limit: check.limit,
      },
      { status: 402 }
    )
  }

  const token = generateInvitationToken()
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS)

  // Si une invitation existe déjà (et est toujours valide), on la met à jour
  const existingInvite = await prisma.teamInvitation.findFirst({
    where: { teamId, email, expiresAt: { gt: new Date() } },
  })
  let invitation
  if (existingInvite) {
    invitation = await prisma.teamInvitation.update({
      where: { id: existingInvite.id },
      data: { token, expiresAt, role: inviteRole },
    })
  } else {
    invitation = await prisma.teamInvitation.create({
      data: { teamId, email, role: inviteRole, token, expiresAt },
    })
  }

  logger.info("teams.invitation_created", {
    route: `/api/teams/${teamId}/invitations`,
    userId: session.user.id,
    teamId,
    inviteeEmail: email.split("@")[0]?.slice(0, 2) + "***",
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? ""
  return NextResponse.json({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    inviteUrl: `${baseUrl}/invitations/${token}`,
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id: teamId } = await params
  const role = await getUserTeamRole(session.user.id, teamId)
  if (!canManageTeam(role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 })
  }

  let body: { invitationId?: unknown }
  try {
    body = (await req.json()) as { invitationId?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }
  const invitationId = typeof body.invitationId === "string" ? body.invitationId : ""
  if (!invitationId) {
    return NextResponse.json({ error: "invitationId requis." }, { status: 400 })
  }

  await prisma.teamInvitation.deleteMany({
    where: { id: invitationId, teamId },
  })
  return NextResponse.json({ success: true })
}
