import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  stripe,
  stripeSubscriptionToPrismaFields,
  invoiceSubscriptionId,
  prismaFieldsForMissingStripeSubscription,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId;
        const customerId =
          typeof s.customer === "string" ? s.customer : s.customer?.id;
        const subscriptionId =
          typeof s.subscription === "string"
            ? s.subscription
            : s.subscription?.id;

        if (userId && subscriptionId && customerId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const fields = stripeSubscriptionToPrismaFields(sub);

          await prisma.subscription.upsert({
            where: { userId },
            update: {
              ...fields,
              stripeCustomerId: customerId,
            },
            create: {
              userId,
              ...fields,
              stripeCustomerId: customerId,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const fields = stripeSubscriptionToPrismaFields(sub);

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: fields,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const fields = stripeSubscriptionToPrismaFields(sub, {
          planOverride: "FREE",
        });

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: fields,
        });
        break;
      }

      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const subscriptionId = invoiceSubscriptionId(inv);
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            await prisma.subscription.updateMany({
              where: { stripeSubscriptionId: subscriptionId },
              data: stripeSubscriptionToPrismaFields(sub),
            });
          } catch (e) {
            console.error("[stripe webhook] invoice.payment_failed", e);
            if (
              e instanceof Stripe.errors.StripeInvalidRequestError &&
              e.code === "resource_missing"
            ) {
              await prisma.subscription.updateMany({
                where: { stripeSubscriptionId: subscriptionId },
                data: prismaFieldsForMissingStripeSubscription(),
              });
            } else {
              throw e;
            }
          }
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
