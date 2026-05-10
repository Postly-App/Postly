import Stripe from "stripe"
import { stripe, getPlanFromPriceId } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("[WEBHOOK] Invalid signature:", err)
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        const userId = checkoutSession.metadata?.userId
        if (!userId) break

        const sub = await stripe.subscriptions.retrieve(
          checkoutSession.subscription as string
        )
        const plan = getPlanFromPriceId(sub.items.data[0].price.id)

        await prisma.subscription.update({
          where: { userId },
          data: {
            plan,
            status: "ACTIVE",
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer as string,
            stripePriceId: sub.items.data[0].price.id,
            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            trialEnd: (sub as any).trial_end
              ? new Date((sub as any).trial_end * 1000)
              : null,
          },
        })
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const plan = getPlanFromPriceId(sub.items.data[0].price.id)

        await prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan,
            status: sub.status.toUpperCase() as any,
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
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
        const subId = (invoice as any).subscription as string
        if (!subId) break

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subId },
          data: { status: "PAST_DUE" },
        })
        break
      }

      default:
        console.log(`[WEBHOOK] Unhandled event: ${event.type}`)
    }
  } catch (error) {
    console.error("[WEBHOOK] Handler error:", error)
    return Response.json({ error: "Handler error" }, { status: 500 })
  }

  return Response.json({ received: true })
}
