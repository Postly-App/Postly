import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getActiveTeamForUser, getUserTeamRole, TEAM_ROLE_LABELS } from "@/lib/team"
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits"
import { Building2 } from "lucide-react"
import TeamClient from "./TeamClient"
import NoTeamClient from "./NoTeamClient"

export const dynamic = "force-dynamic"

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const plan = await getUserActivePlan(session.user.id)
  if (!PLAN_LIMITS[plan].multiClient) {
    return <UpgradeNotice />
  }

  const activeTeam = await getActiveTeamForUser(session.user.id)
  if (!activeTeam) {
    return <NoTeamClient />
  }

  const role = await getUserTeamRole(session.user.id, activeTeam.id)
  const team = await prisma.team.findUnique({
    where: { id: activeTeam.id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      invitations: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      },
      owner: { select: { id: true, name: true, email: true, image: true } },
    },
  })
  if (!team) redirect("/settings")

  return (
    <TeamClient
      teamId={team.id}
      teamName={team.name}
      owner={team.owner}
      members={team.members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
        roleLabel: TEAM_ROLE_LABELS[m.role],
        joinedAt: m.acceptedAt?.toISOString() ?? null,
      }))}
      pendingInvitations={team.invitations.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        roleLabel: TEAM_ROLE_LABELS[i.role],
        expiresAt: i.expiresAt.toISOString(),
      }))}
      seatLimit={PLAN_LIMITS[plan].teamSeats}
      currentSeatUsage={team.members.length + team.invitations.length}
      canManage={role === "owner" || role === "admin"}
      isOwner={role === "owner"}
    />
  )
}

function UpgradeNotice() {
  return (
    <div style={{ padding: 60, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "linear-gradient(180deg, rgba(52,211,153,0.10), rgba(52,211,153,0.04))",
        border: "1px solid rgba(52,211,153,0.20)",
        display: "inline-flex",
        alignItems: "center", justifyContent: "center", marginBottom: 20,
        boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -8px rgba(52,211,153,0.20)",
      }}>
        <Building2 size={26} strokeWidth={1.5} color="#34D399" />
      </div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 12 }}>
        Équipe et clients — plan Agence
      </h1>
      <p style={{ color: "var(--clr-muted)", fontSize: "0.95rem", marginBottom: 24, lineHeight: 1.6 }}>
        Invite jusqu&apos;à 5 collaborateurs, gère plusieurs clients dans un seul tableau de bord et
        exporte des rapports en marque blanche.
      </p>
      <a
        href="/billing"
        style={{
          display: "inline-block",
          background: "linear-gradient(135deg,#22D3A0,#1FB089)",
          color: "#fff",
          padding: "14px 28px",
          borderRadius: 12,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Passer au plan Agence
      </a>
    </div>
  )
}
