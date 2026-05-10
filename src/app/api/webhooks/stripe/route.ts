import Stripe from "stripe"
import { stripe, getPlanFromPriceId } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import type { SubscriptionStatus } from "@prisma/client"

const STATUS_MAP: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
  active: "ACTIVE",
  canceled: "CANCELED",
  past_due: "PAST_DUE",
  trialing: "TRIALING",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  unpaid: "PAST_DUE",
  paused: "INCOMPLETE",
}

function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  return STATUS_MAP[s] ?? "INCOMPLETE"
}

function periodEnd(sub: Stripe.Subscription): Date {
  const item = sub.items.data[0]
  const ts = item?.current_period_end ?? sub.billing_cycle_anchor
  return new Date(ts * 1000)
}

function periodStart(sub: Stripe.Subscription): Date {
  const item = sub.items.data[0]
  const ts = item?.current_period_start ?? sub.billing_cycle_anchor
  return new Date(ts * 1000)
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) {
    return Response.json({ error: "Missing signature or secret" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error("[WEBHOOK] Invalid signature:", err)
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        const userId = checkoutSession.metadata?.userId
        if (!userId || !checkoutSession.subscription) break

        const subId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription.id

        const sub = await stripe.subscriptions.retrieve(subId)
        const priceId = sub.items.data[0]?.price.id
        if (!priceId) break

        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id

        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: getPlanFromPriceId(priceId),
            status: mapStatus(sub.status),
            stripeSubscriptionId: sub.id,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            currentPeriodStart: periodStart(sub),
            currentPeriodEnd: periodEnd(sub),
            trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          },
        })
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        if (!priceId) break

        await prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan: getPlanFromPriceId(priceId),
            status: mapStatus(sub.status),
            currentPeriodEnd: periodEnd(sub),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        await prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: { plan: "FREE", status: "CANCELED" },
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const line = invoice.lines.data.find((l) => l.subscription)
        const subRef = line?.subscription ?? null
        const subId = typeof subRef === "string" ? subRef : subRef?.id ?? null
        if (!subId) break

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subId },
          data: { status: "PAST_DUE" },
        })
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error("[WEBHOOK] Handler error:", error)
    return Response.json({ error: "Handler error" }, { status: 500 })
  }

  return Response.json({ received: true })
}
