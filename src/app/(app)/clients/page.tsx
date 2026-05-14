import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getActiveTeamForUser, getUserTeamRole, canManageTeam } from "@/lib/team"
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits"
import ClientsPage from "./ClientsPage"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const plan = await getUserActivePlan(session.user.id)
  if (!PLAN_LIMITS[plan].multiClient) {
    return (
      <div style={{ padding: 60, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 10 }}>
          Multi-clients — plan Agence
        </h1>
        <p style={{ color: "var(--clr-muted)", marginBottom: 20 }}>
          Gère plusieurs marques dans un seul tableau de bord, scope tes posts et tes
          comptes sociaux par client.
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

  const team = await getActiveTeamForUser(session.user.id)
  if (!team) {
    return (
      <div style={{ padding: 60, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 10 }}>Aucune équipe</h1>
        <p style={{ color: "var(--clr-muted)", marginBottom: 20 }}>
          Crée d&apos;abord ton équipe pour ajouter des clients.
        </p>
        <a href="/settings/team" style={{
          display: "inline-block", padding: "12px 24px", borderRadius: 12,
          background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)", color: "#fff",
          fontWeight: 700, textDecoration: "none",
        }}>
          Créer mon équipe
        </a>
      </div>
    )
  }

  const role = await getUserTeamRole(session.user.id, team.id)
  const clients = await prisma.client.findMany({
    where: { teamId: team.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { posts: true, socialAccounts: true },
      },
    },
  })

  return (
    <ClientsPage
      teamName={team.name}
      canManage={canManageTeam(role)}
      clients={clients.map((c) => ({
        id: c.id,
        name: c.name,
        brandColor: c.brandColor,
        logoUrl: c.logoUrl,
        postCount: c._count.posts,
        socialCount: c._count.socialAccounts,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  )
}
