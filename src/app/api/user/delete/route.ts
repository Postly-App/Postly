import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { logger } from "@/lib/logger"

/**
 * Suppression définitive du compte (droit à l'oubli RGPD).
 * - Annule l'abonnement Stripe à la fin de la période (pas d'interruption immédiate de service avant la confirmation user)
 * - Supprime le user en base ; les relations onDelete: Cascade nettoient tout
 *
 * Body : { confirm: "DELETE" } pour éviter les suppressions accidentelles.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { confirm?: unknown }
  try {
    body = (await req.json()) as { confirm?: unknown }
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Confirme en envoyant { "confirm": "DELETE" }.' },
      { status: 400 }
    )
  }

  const userId = session.user.id

  try {
    // 1. Annule Stripe (best-effort, ne bloque pas la suppression DB si Stripe down)
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { stripeSubscriptionId: true, stripeCustomerId: true },
    })
    if (sub?.stripeSubscriptionId && !sub.stripeSubscriptionId.startsWith("free_")) {
      try {
        await getStripe().subscriptions.cancel(sub.stripeSubscriptionId, {
          invoice_now: false,
          prorate: false,
        })
      } catch (e) {
        logger.warn("user.delete.stripe_cancel_failed", {
          route: "/api/user/delete",
          userId,
          err: e,
        })
      }
    }
    if (sub?.stripeCustomerId && !sub.stripeCustomerId.startsWith("free_")) {
      try {
        await getStripe().customers.del(sub.stripeCustomerId)
      } catch (e) {
        logger.warn("user.delete.stripe_customer_del_failed", {
          route: "/api/user/delete",
          userId,
          err: e,
        })
      }
    }

    // 2. Supprime le user — Cascade nettoie posts, socialAccounts, subscription,
    // analytics, sessions, accounts, apiKeys, teamMemberships, ownedTeams (et leurs membres/clients).
    await prisma.user.delete({ where: { id: userId } })

    logger.audit("user.deleted", { route: "/api/user/delete", userId })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("user.delete_failed", { route: "/api/user/delete", userId, err })
    return NextResponse.json({ error: "Suppression impossible." }, { status: 500 })
  }
}
