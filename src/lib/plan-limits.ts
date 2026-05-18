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
    storageBytes: 1 * 1024 * 1024 * 1024, // 1 GB
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
    storageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
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
    storageBytes: 500 * 1024 * 1024 * 1024, // 500 GB
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
    storageBytes: number
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
 * Contexte de plan utilisateur — source unique pour tout le frontend.
 * Retourne le plan + des booléens pratiques + les limites. Utilisé pour
 * conditionner les CTA d'upgrade, les badges, et le gating de features
 * sans dupliquer la logique `plan === "PRO"` partout.
 *
 * `isPaid` = true pour PRO et AGENCY (= ne pas afficher "Upgrade Pro").
 */
export interface UserPlanContext {
  plan: Plan
  isFree: boolean
  isPro: boolean
  isAgency: boolean
  isPaid: boolean
  limits: PlanLimits
}

export async function getUserPlanContext(userId: string): Promise<UserPlanContext> {
  const plan = await getUserActivePlan(userId)
  return {
    plan,
    isFree: plan === "FREE",
    isPro: plan === "PRO",
    isAgency: plan === "AGENCY",
    isPaid: plan !== "FREE",
    limits: PLAN_LIMITS[plan],
  }
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
 * Vérifie qu'un fichier de taille `incomingBytes` peut être uploadé sans dépasser le quota.
 */
export async function checkCanUpload(
  userId: string,
  incomingBytes: number,
  options?: { plan?: Plan }
): Promise<PlanCheckResult> {
  const plan = options?.plan ?? (await getUserActivePlan(userId))
  const limit = PLAN_LIMITS[plan].storageBytes

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageBytes: true },
  })
  const used = user?.storageBytes ? Number(user.storageBytes) : 0
  if (used + incomingBytes > limit) {
    const gbLimit = (limit / (1024 ** 3)).toFixed(0)
    return {
      allowed: false,
      reason: `Quota de stockage dépassé (${gbLimit} Go pour le plan ${plan}). Supprime des médias ou passe au plan supérieur.`,
      limit,
      current: used,
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
