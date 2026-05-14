import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Healthcheck pour monitoring (uptime robot, BetterStack, etc.).
 * GET /api/health → 200 { ok: true } si DB répond, 503 sinon.
 */
export async function GET() {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      ok: true,
      db: "up",
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      },
      { status: 503 }
    )
  }
}
