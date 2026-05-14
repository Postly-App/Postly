import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveTeamForUser } from "@/lib/team"
import { ACTIVE_CLIENT_COOKIE } from "@/lib/active-client"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { clientId?: unknown }
  try {
    body = (await req.json()) as { clientId?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }

  const raw = body.clientId
  // null/empty = clear cookie (mode "Tous les clients")
  if (raw === null || raw === "" || typeof raw !== "string") {
    const res = NextResponse.json({ success: true, clientId: null })
    res.cookies.delete(ACTIVE_CLIENT_COOKIE)
    return res
  }

  const team = await getActiveTeamForUser(session.user.id)
  if (!team) {
    return NextResponse.json({ error: "Aucune équipe." }, { status: 400 })
  }
  const client = await prisma.client.findFirst({
    where: { id: raw, teamId: team.id },
    select: { id: true },
  })
  if (!client) {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 })
  }

  const res = NextResponse.json({ success: true, clientId: client.id })
  res.cookies.set(ACTIVE_CLIENT_COOKIE, client.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 90, // 90 jours
  })
  return res
}
