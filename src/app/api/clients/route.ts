import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveTeamForUser, getUserTeamRole, canManageTeam } from "@/lib/team"
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits"
import { logger } from "@/lib/logger"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const team = await getActiveTeamForUser(session.user.id)
  if (!team) return NextResponse.json([])

  const clients = await prisma.client.findMany({
    where: { teamId: team.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(clients)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const plan = await getUserActivePlan(session.user.id)
  if (!PLAN_LIMITS[plan].multiClient) {
    return NextResponse.json(
      { error: "La gestion multi-clients est réservée au plan Agence.", code: "PLAN_LIMIT_REACHED" },
      { status: 402 }
    )
  }

  const team = await getActiveTeamForUser(session.user.id)
  if (!team) {
    return NextResponse.json(
      { error: "Crée d'abord une équipe pour ajouter des clients." },
      { status: 400 }
    )
  }
  const role = await getUserTeamRole(session.user.id, team.id)
  if (!canManageTeam(role)) {
    return NextResponse.json({ error: "Action réservée aux administrateurs." }, { status: 403 })
  }

  let body: { name?: unknown; brandColor?: unknown; logoUrl?: unknown }
  try {
    body = (await req.json()) as { name?: unknown; brandColor?: unknown; logoUrl?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Nom du client invalide (2-100 caractères)." }, { status: 400 })
  }
  const brandColor = typeof body.brandColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.brandColor)
    ? body.brandColor
    : null
  const logoUrl = typeof body.logoUrl === "string" && body.logoUrl.startsWith("https://")
    ? body.logoUrl.slice(0, 500)
    : null

  const client = await prisma.client.create({
    data: { teamId: team.id, name, brandColor, logoUrl },
  })
  logger.info("clients.created", { route: "/api/clients", userId: session.user.id, teamId: team.id, clientId: client.id })
  return NextResponse.json(client, { status: 201 })
}
