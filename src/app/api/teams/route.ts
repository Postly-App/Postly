import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkCanCreateTeam, listTeamsForUser } from "@/lib/team"
import { logger } from "@/lib/logger"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const teams = await listTeamsForUser(session.user.id)
  return NextResponse.json(teams)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { name?: unknown }
  try {
    body = (await req.json()) as { name?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }

  const rawName = typeof body.name === "string" ? body.name.trim() : ""
  if (rawName.length < 2 || rawName.length > 80) {
    return NextResponse.json(
      { error: "Le nom de l'équipe doit faire entre 2 et 80 caractères." },
      { status: 400 }
    )
  }

  const check = await checkCanCreateTeam(session.user.id)
  if (!check.allowed) {
    return NextResponse.json(
      { error: check.reason, code: "PLAN_LIMIT_REACHED" },
      { status: 402 }
    )
  }

  try {
    const team = await prisma.team.create({
      data: { name: rawName, ownerId: session.user.id },
    })
    logger.info("teams.created", { route: "/api/teams", userId: session.user.id, teamId: team.id })
    return NextResponse.json(team, { status: 201 })
  } catch (err) {
    logger.error("teams.create_failed", { route: "/api/teams", userId: session.user.id, err })
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 })
  }
}
