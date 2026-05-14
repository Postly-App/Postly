import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getClientIpFromHeaders } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import {
  getStripe,
  stripeSubscriptionToPrismaFields,
  invoiceSubscriptionId,
  prismaFieldsForMissingStripeSubscription,
} from "@/lib/stripe";
import {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
} from "@/lib/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const h = await headers();
  const ip = getClientIpFromHeaders(h);
  const flood = await enforceRateLimit(
    "stripeIp",
    `ip:${ip}`,
    "Trop de requêtes webhook. Réessayez plus tard."
  );
  if (flood) return flood;

  const sig = h.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.error("stripe.webhook.signature_invalid", {
      route: "/api/webhooks/stripe",
      action: "constructEvent",
      err,
    });
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
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
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

          // Email de bienvenue PRO/AGENCY
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
          });
          if (user?.email) {
            sendPaymentSuccessEmail(user.email, fields.plan).catch(() => {});
          }
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

        const subRecord = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
          include: { user: { select: { email: true } } },
        });

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: fields,
        });

        if (subRecord?.user.email) {
          sendSubscriptionCanceledEmail(subRecord.user.email).catch(() => {});
        }
        break;
      }

      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const subscriptionId = invoiceSubscriptionId(inv);
        if (subscriptionId) {
          try {
            const sub = await getStripe().subscriptions.retrieve(subscriptionId);
            await prisma.subscription.updateMany({
              where: { stripeSubscriptionId: subscriptionId },
              data: stripeSubscriptionToPrismaFields(sub),
            });

            const subRecord = await prisma.subscription.findFirst({
              where: { stripeSubscriptionId: subscriptionId },
              include: { user: { select: { email: true } } },
            });
            if (subRecord?.user.email) {
              sendPaymentFailedEmail(subRecord.user.email).catch(() => {});
            }
          } catch (e) {
            logger.warn("stripe.webhook.invoice_payment_failed", {
              route: "/api/webhooks/stripe",
              action: "invoice.payment_failed",
              err: e,
            });
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
    logger.error("stripe.webhook.handler_failed", {
      route: "/api/webhooks/stripe",
      action: "handler",
      err,
    });
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
