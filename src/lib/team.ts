import { randomBytes } from "crypto"
import type { Team, TeamMember, TeamRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits"

/**
 * Retourne la team principale de l'utilisateur (premier "owned team" ou première team rejointe).
 * Pour un user AGENCY qui n'a pas encore créé d'équipe, retourne null.
 */
export async function getActiveTeamForUser(userId: string): Promise<Team | null> {
  const owned = await prisma.team.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  })
  if (owned) return owned

  const membership = await prisma.teamMember.findFirst({
    where: { userId, acceptedAt: { not: null } },
    orderBy: { createdAt: "asc" },
    include: { team: true },
  })
  return membership?.team ?? null
}

/**
 * Liste des teams accessibles à l'utilisateur (en tant qu'owner ou membre accepté).
 */
export async function listTeamsForUser(userId: string): Promise<Team[]> {
  const [owned, memberships] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { userId, acceptedAt: { not: null } },
      include: { team: true },
      orderBy: { createdAt: "asc" },
    }),
  ])
  const seen = new Set<string>()
  const result: Team[] = []
  for (const t of owned) {
    if (!seen.has(t.id)) {
      seen.add(t.id)
      result.push(t)
    }
  }
  for (const m of memberships) {
    if (!seen.has(m.teamId)) {
      seen.add(m.teamId)
      result.push(m.team)
    }
  }
  return result
}

export type TeamAccessKind = "owner" | "admin" | "member" | "none"

/**
 * Détermine le rôle de l'utilisateur dans une team (owner > admin > member > none).
 */
export async function getUserTeamRole(
  userId: string,
  teamId: string
): Promise<TeamAccessKind> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  })
  if (!team) return "none"
  if (team.ownerId === userId) return "owner"

  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true, acceptedAt: true },
  })
  if (!member || !member.acceptedAt) return "none"
  if (member.role === "ADMIN") return "admin"
  return "member"
}

export function canManageTeam(role: TeamAccessKind): boolean {
  return role === "owner" || role === "admin"
}

/**
 * Vérifie qu'un user peut créer une nouvelle team (plan AGENCY uniquement, limite 1 team par owner).
 */
export async function checkCanCreateTeam(userId: string): Promise<
  { allowed: true } | { allowed: false; reason: string }
> {
  const plan = await getUserActivePlan(userId)
  if (!PLAN_LIMITS[plan].multiClient) {
    return {
      allowed: false,
      reason: "La création d'équipe est réservée au plan Agence.",
    }
  }
  const existing = await prisma.team.count({ where: { ownerId: userId } })
  if (existing >= 1) {
    return {
      allowed: false,
      reason: "Tu possèdes déjà une équipe. Une seule équipe par compte propriétaire.",
    }
  }
  return { allowed: true }
}

/**
 * Vérifie qu'un membre supplémentaire peut être invité sans dépasser le quota du plan.
 * Inclut les membres acceptés ET les invitations en cours non expirées.
 */
export async function checkCanInviteMember(
  teamId: string,
  ownerId: string
): Promise<{ allowed: true } | { allowed: false; reason: string; current: number; limit: number }> {
  const plan = await getUserActivePlan(ownerId)
  const limit = PLAN_LIMITS[plan].teamSeats
  if (limit <= 0) {
    return {
      allowed: false,
      reason: "L'invitation d'équipe est réservée au plan Agence.",
      current: 0,
      limit: 0,
    }
  }
  const [memberCount, pendingCount] = await Promise.all([
    prisma.teamMember.count({ where: { teamId } }),
    prisma.teamInvitation.count({
      where: { teamId, expiresAt: { gt: new Date() } },
    }),
  ])
  // Ne compte pas l'owner dans les sièges (lui = +1 implicite)
  const current = memberCount + pendingCount
  if (current >= limit) {
    return {
      allowed: false,
      reason: `Limite atteinte : ${limit} sièges. Retire un membre ou une invitation en attente.`,
      current,
      limit,
    }
  }
  return { allowed: true }
}

/**
 * Génère un token d'invitation cryptographiquement aléatoire (url-safe).
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url")
}

/**
 * Durée de validité d'une invitation par défaut : 7 jours.
 */
export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type TeamMemberWithUser = TeamMember & {
  user: { id: string; name: string | null; email: string; image: string | null }
}

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Admin",
  MEMBER: "Membre",
}
