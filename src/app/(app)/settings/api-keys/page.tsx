import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Key } from "lucide-react"
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
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(180deg, rgba(52,211,153,0.10), rgba(52,211,153,0.04))",
          border: "1px solid rgba(52,211,153,0.20)",
          display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          marginBottom: 20,
          boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -8px rgba(52,211,153,0.20)",
        }}>
          <Key size={26} strokeWidth={1.5} color="#34D399" />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 10, letterSpacing: "-0.02em" }}>
          API publique — plan Agence
        </h1>
        <p style={{ color: "var(--text-3)", marginBottom: 24, lineHeight: 1.55 }}>
          Génère des clés API pour intégrer Postly à tes outils (Zapier, n8n, scripts custom).
        </p>
        <a href="/billing" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 24px",
          borderRadius: 12,
          background: "linear-gradient(180deg, #34D399, #10B981)",
          color: "#062B22",
          fontWeight: 600,
          fontSize: "0.92rem",
          textDecoration: "none",
          boxShadow: "0 1px 0 0 rgba(255,255,255,0.18) inset, 0 8px 24px -8px rgba(52,211,153,0.40)",
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
