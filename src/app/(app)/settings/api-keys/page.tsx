import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits"
import ApiKeysClient from "./ApiKeysClient"

export const dynamic = "force-dynamic"

export default async function ApiKeysPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const plan = await getUserActivePlan(session.user.id)
  if (!PLAN_LIMITS[plan].publicApi) {
    return (
      <div style={{ padding: 60, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🔑</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 10 }}>
          API publique — plan Agence
        </h1>
        <p style={{ color: "var(--clr-muted)", marginBottom: 20 }}>
          Génère des clés API pour intégrer Postly à tes outils (Zapier, n8n, scripts custom).
        </p>
        <a href="/billing" style={{
          display: "inline-block", padding: "12px 24px", borderRadius: 12,
          background: "linear-gradient(135deg,#22D3A0,#1FB089)", color: "#fff",
          fontWeight: 700, textDecoration: "none",
        }}>
          Passer au plan Agence
        </a>
      </div>
    )
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

  return (
    <ApiKeysClient
      keys={keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        expiresAt: k.expiresAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
      }))}
    />
  )
}
