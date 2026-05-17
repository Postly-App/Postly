import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getStripe, priceIdToPlan } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

/** Set of valid Stripe priceIds, computed from env. Empty = misconfigured server. */
function getAcceptedPriceIds(): Set<string> {
  const ids = [
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,
    process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,
  ].filter((v): v is string => Boolean(v && v.trim()))
  return new Set(ids)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { priceId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 })
  }
  const priceId = body.priceId?.trim()

  if (!priceId) {
    return NextResponse.json({ error: "priceId requis." }, { status: 400 })
  }

  // Reject unknown priceIds before hitting Stripe. Prevents silent miscategorization
  // (priceIdToPlan defaults to PRO on unknown input) and protects against arbitrary
  // priceIds passed by clients.
  const accepted = getAcceptedPriceIds()
  if (accepted.size === 0) {
    logger.error("api.billing.checkout.no_price_ids_configured", {
      route: "/api/billing/checkout",
      action: "POST",
    })
    return NextResponse.json(
      { error: "Facturation non configurée sur ce serveur." },
      { status: 503 }
    )
  }
  if (!accepted.has(priceId)) {
    return NextResponse.json(
      { error: "Plan non reconnu." },
      { status: 400 }
    )
  }

  const appUrl = (process.env.NEXTAUTH_URL || process.env.APP_URL || "").trim()
  if (!appUrl) {
    logger.error("api.billing.checkout.missing_app_url", {
      route: "/api/billing/checkout",
      action: "POST",
    })
    return NextResponse.json(
      { error: "Configuration serveur incomplète." },
      { status: 503 }
    )
  }

  const plan = priceIdToPlan(priceId)

  // Reuse an existing Stripe customer if we have one (cancelled subs, repeat
  // checkouts, plan changes). Otherwise pass the email so Stripe creates the
  // customer with the right address. Critical : without this, every checkout
  // creates a new cus_* and splits the user's billing history.
  const existingSub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  })

  const customerArgs: { customer?: string; customer_email?: string } = {}
  if (
    existingSub?.stripeCustomerId &&
    !existingSub.stripeCustomerId.startsWith("free_")
  ) {
    customerArgs.customer = existingSub.stripeCustomerId
  } else if (session.user.email) {
    customerArgs.customer_email = session.user.email
  }

  const subscriptionData: {
    metadata: { userId: string }
    trial_period_days?: number
  } = {
    metadata: { userId: session.user.id },
  }
  if (plan === "PRO") {
    subscriptionData.trial_period_days = 7
  }

  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing/success?plan=${plan.toLowerCase()}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      metadata: { userId: session.user.id },
      subscription_data: subscriptionData,
      ...customerArgs,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    logger.error("api.billing.checkout.stripe_failed", {
      route: "/api/billing/checkout",
      action: "POST",
      userId: session.user.id,
      err: error,
    })
    return NextResponse.json(
      { error: "Impossible d'ouvrir la page de paiement. Réessaie dans un instant." },
      { status: 502 }
    )
  }
}
