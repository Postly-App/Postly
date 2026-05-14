import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateApiKey } from "@/lib/api-keys"
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits"
import { logger } from "@/lib/logger"

const MAX_KEYS_PER_USER = 10

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  })
  return NextResponse.json(keys)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const plan = await getUserActivePlan(session.user.id)
  if (!PLAN_LIMITS[plan].publicApi) {
    return NextResponse.json(
      { error: "L'API publique est réservée au plan Agence.", code: "PLAN_LIMIT_REACHED" },
      { status: 402 }
    )
  }

  let body: { name?: unknown; expiresInDays?: unknown }
  try {
    body = (await req.json()) as { name?: unknown; expiresInDays?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (name.length < 1 || name.length > 80) {
    return NextResponse.json({ error: "Nom de clé invalide (1-80 caractères)." }, { status: 400 })
  }

  const count = await prisma.apiKey.count({ where: { userId: session.user.id } })
  if (count >= MAX_KEYS_PER_USER) {
    return NextResponse.json(
      { error: `Limite atteinte : ${MAX_KEYS_PER_USER} clés API maximum.` },
      { status: 400 }
    )
  }

  const expiresInDays = typeof body.expiresInDays === "number" && body.expiresInDays > 0
    ? Math.min(365, Math.floor(body.expiresInDays))
    : null
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  const { key, prefix, hashed } = generateApiKey()
  const created = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      name,
      prefix,
      hashedKey: hashed,
      expiresAt,
    },
    select: { id: true, name: true, prefix: true, expiresAt: true, createdAt: true },
  })

  logger.info("api_keys.created", {
    route: "/api/api-keys",
    userId: session.user.id,
    keyId: created.id,
    prefix,
  })

  // Retourne la clé EN CLAIR uniquement à la création.
  return NextResponse.json({ ...created, key }, { status: 201 })
}
