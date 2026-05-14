import type { Plan } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * Limites par plan d'abonnement. Source unique pour l'enforcement côté API.
 * `Infinity` = pas de limite. Les chiffres reflètent ce qui est annoncé sur la page Tarifs.
 */
export const PLAN_LIMITS = {
  FREE: {
    maxSocialAccounts: 3,
    maxScheduledPostsPerMonth: 10,
    aiAssistant: false,
    advancedAnalytics: false,
    teamSeats: 0,
    multiClient: false,
    publicApi: false,
    whiteLabel: false,
  },
  PRO: {
    maxSocialAccounts: 15,
    maxScheduledPostsPerMonth: Infinity,
    aiAssistant: true,
    advancedAnalytics: true,
    teamSeats: 0,
    multiClient: false,
    publicApi: false,
    whiteLabel: false,
  },
  AGENCY: {
    maxSocialAccounts: Infinity,
    maxScheduledPostsPerMonth: Infinity,
    aiAssistant: true,
    advancedAnalytics: true,
    teamSeats: 5,
    multiClient: true,
    publicApi: true,
    whiteLabel: true,
  },
} as const satisfies Record<
  Plan,
  {
    maxSocialAccounts: number
    maxScheduledPostsPerMonth: number
    aiAssistant: boolean
    advancedAnalytics: boolean
    teamSeats: number
    multiClient: boolean
    publicApi: boolean
    whiteLabel: boolean
  }
>

export type PlanLimits = (typeof PLAN_LIMITS)[Plan]

export type PlanCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; limit: number; current: number; plan: Plan }

/**
 * Plan actif d'un utilisateur. Un abonnement ACTIVE/TRIALING/PAST_DUE compte comme valide ;
 * sinon FREE par défaut.
 */
export async function getUserActivePlan(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  })
  if (!sub) return "FREE"
  const validStatuses: ReadonlyArray<string> = ["ACTIVE", "TRIALING", "PAST_DUE"]
  if (!validStatuses.includes(sub.status)) return "FREE"
  return sub.plan
}

/**
 * Vérifie si l'utilisateur a accès aux features AGENCY (multi-clients, équipe, API, white-label).
 */
export async function checkCanUseAgencyFeature(
  userId: string,
  feature: "multiClient" | "publicApi" | "whiteLabel" | "teamSeats",
  options?: { plan?: Plan }
): Promise<PlanCheckResult> {
  const plan = options?.plan ?? (await getUserActivePlan(userId))
  const limits = PLAN_LIMITS[plan]
  const hasAccess =
    feature === "teamSeats" ? limits.teamSeats > 0 : limits[feature]
  if (!hasAccess) {
    return {
      allowed: false,
      reason:
        "Cette fonctionnalité est réservée au plan Agence.",
      limit: 0,
      current: 0,
      plan,
    }
  }
  return { allowed: true }
}

/**
 * Vérifie qu'un nouveau compte social peut être connecté sans dépasser la limite du plan.
 */
export async function checkCanAddSocialAccount(
  userId: string,
  options?: { plan?: Plan }
): Promise<PlanCheckResult> {
  const plan = options?.plan ?? (await getUserActivePlan(userId))
  const limit = PLAN_LIMITS[plan].maxSocialAccounts
  if (!Number.isFinite(limit)) return { allowed: true }

  const current = await prisma.socialAccount.count({ where: { userId } })
  if (current >= limit) {
    return {
      allowed: false,
      reason: `Plan ${plan} : ${limit} comptes sociaux maximum. Passez au plan supérieur pour en connecter davantage.`,
      limit,
      current,
      plan,
    }
  }
  return { allowed: true }
}

/**
 * Vérifie si l'utilisateur a accès à l'assistant IA dashboard (PRO + AGENCY).
 */
export async function checkCanUseAi(
  userId: string,
  options?: { plan?: Plan }
): Promise<PlanCheckResult> {
  const plan = options?.plan ?? (await getUserActivePlan(userId))
  if (!PLAN_LIMITS[plan].aiAssistant) {
    return {
      allowed: false,
      reason:
        "L'assistant IA est réservé aux plans Pro et Agence. Passe au plan supérieur pour l'activer.",
      limit: 0,
      current: 0,
      plan,
    }
  }
  return { allowed: true }
}

/**
 * Vérifie si l'utilisateur a accès aux analytics avancés (PRO + AGENCY).
 */
export async function checkCanUseAdvancedAnalytics(
  userId: string,
  options?: { plan?: Plan }
): Promise<PlanCheckResult> {
  const plan = options?.plan ?? (await getUserActivePlan(userId))
  if (!PLAN_LIMITS[plan].advancedAnalytics) {
    return {
      allowed: false,
      reason:
        "Les analytics avancés sont réservés aux plans Pro et Agence.",
      limit: 0,
      current: 0,
      plan,
    }
  }
  return { allowed: true }
}

/**
 * Vérifie qu'un post planifié supplémentaire peut être créé ce mois-ci.
 * S'applique uniquement aux posts SCHEDULED (les brouillons DRAFT ne comptent pas).
 */
export async function checkCanSchedulePost(
  userId: string,
  options?: { plan?: Plan }
): Promise<PlanCheckResult> {
  const plan = options?.plan ?? (await getUserActivePlan(userId))
  const limit = PLAN_LIMITS[plan].maxScheduledPostsPerMonth
  if (!Number.isFinite(limit)) return { allowed: true }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const current = await prisma.post.count({
    where: {
      userId,
      status: { in: ["SCHEDULED", "PUBLISHED"] },
      createdAt: { gte: startOfMonth },
    },
  })
  if (current >= limit) {
    return {
      allowed: false,
      reason: `Plan ${plan} : ${limit} posts planifiés par mois maximum. Passez au plan supérieur pour publier davantage.`,
      limit,
      current,
      plan,
    }
  }
  return { allowed: true }
}
