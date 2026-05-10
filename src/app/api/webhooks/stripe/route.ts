import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-11-20.acacia" });

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        const subscriptionId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        if (userId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              stripeCustomerId: customerId!,
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
              status: sub.status,
            },
            create: {
              userId,
              stripeCustomerId: customerId!,
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
              status: sub.status,
            },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            stripePriceId: sub.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
            status: sub.status,
          },
        });
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        if (inv.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: inv.subscription as string },
            data: { status: "past_due" },
          });
        }
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
