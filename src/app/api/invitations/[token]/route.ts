import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

/** GET — détails publics d'une invitation (avant connexion). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const inv = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  })
  if (!inv) {
    return NextResponse.json({ error: "Invitation introuvable." }, { status: 404 })
  }
  if (inv.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Invitation expirée." }, { status: 410 })
  }
  return NextResponse.json({
    email: inv.email,
    role: inv.role,
    teamName: inv.team.name,
    expiresAt: inv.expiresAt,
  })
}

/** POST — accepte l'invitation (l'utilisateur doit être connecté avec le bon email). */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Connecte-toi avec l'email invité pour accepter." }, { status: 401 })
  }

  const { token } = await params
  const inv = await prisma.teamInvitation.findUnique({ where: { token } })
  if (!inv) {
    return NextResponse.json({ error: "Invitation introuvable." }, { status: 404 })
  }
  if (inv.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Invitation expirée." }, { status: 410 })
  }
  if (inv.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `Cette invitation est destinée à ${inv.email}. Connecte-toi avec ce compte.`,
      },
      { status: 403 }
    )
  }

  // Idempotent : si déjà membre, retourne success.
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: inv.teamId, userId: session.user.id } },
  })
  if (existing) {
    await prisma.teamInvitation.delete({ where: { id: inv.id } })
    return NextResponse.json({ success: true, teamId: inv.teamId, alreadyMember: true })
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: inv.teamId,
        userId: session.user.id,
        role: inv.role,
        invitedBy: null,
        acceptedAt: new Date(),
      },
    }),
    prisma.teamInvitation.delete({ where: { id: inv.id } }),
  ])

  logger.info("teams.invitation_accepted", {
    route: `/api/invitations/${token}`,
    userId: session.user.id,
    teamId: inv.teamId,
  })
  return NextResponse.json({ success: true, teamId: inv.teamId })
}
