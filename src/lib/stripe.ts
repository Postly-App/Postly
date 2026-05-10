import Stripe from "stripe"
import { prisma } from "./prisma"
import type { Plan } from "@prisma/client"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")

const PRICE_TO_PLAN: Record<string, Plan> = (() => {
  const entries: Array<[string | undefined, Plan]> = [
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID, "PRO"],
    [process.env.STRIPE_PRO_YEARLY_PRICE_ID, "PRO"],
    [process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID, "AGENCY"],
    [process.env.STRIPE_AGENCY_YEARLY_PRICE_ID, "AGENCY"],
  ]
  const map: Record<string, Plan> = {}
  for (const [id, plan] of entries) {
    if (id && id.length > 0) map[id] = plan
  }
  return map
})()

export function getPlanFromPriceId(priceId: string): Plan {
  return PRICE_TO_PLAN[priceId] ?? "FREE"
}

export async function createBillingPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  })

  if (!subscription?.stripeCustomerId || subscription.stripeCustomerId.startsWith("free_")) {
    throw new Error("No Stripe customer for this user")
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  })

  return session.url
}
