import Stripe from "stripe";
import { prisma } from "./prisma";
import type { Plan, SubscriptionStatus } from "@prisma/client";

/** Version API attendue par le SDK Stripe installé (cf. `Stripe.LatestApiVersion`). */
export const STRIPE_API_VERSION = "2026-04-22.dahlia" as const;

export const STRIPE_STATUS_MAP: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE_EXPIRED",
  paused: "PAUSED",
};

/** Toujours passer par ici pour persister un statut d’abonnement Stripe → enum Prisma (aucune chaîne brute Stripe en DB). */
export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  return STRIPE_STATUS_MAP[status];
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: STRIPE_API_VERSION,
});

/** Mappe les Price IDs Stripe (env) vers l’enum Prisma `Plan`. */
export function priceIdToPlan(priceId: string): Plan {
  if (!priceId || priceId === "free") return "FREE";

  const agencyIds = [
    process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,
    process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,
  ].filter((id): id is string => Boolean(id));
  if (agencyIds.includes(priceId)) return "AGENCY";

  const proIds = [
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  ].filter((id): id is string => Boolean(id));
  if (proIds.includes(priceId)) return "PRO";

  return "PRO";
}

function subscriptionPriceId(sub: Stripe.Subscription): string {
  const priceField = sub.items.data[0]?.price;
  if (typeof priceField === "string") return priceField;
  return priceField?.id ?? "free";
}

/** Périodes de facturation : depuis Stripe v22 elles sont sur le premier `SubscriptionItem`. */
function subscriptionBillingPeriod(sub: Stripe.Subscription): {
  start: Date;
  end: Date;
} {
  const item0 = sub.items.data[0];
  const startSec = item0?.current_period_start ?? sub.start_date;
  const endSec = item0?.current_period_end ?? startSec;
  return {
    start: new Date(startSec * 1000),
    end: new Date(endSec * 1000),
  };
}

/** Champs `Subscription` alignés sur `schema.prisma` à partir d’un objet Stripe Subscription. */
export function stripeSubscriptionToPrismaFields(
  sub: Stripe.Subscription,
  options?: { planOverride?: Plan }
) {
  const priceId = subscriptionPriceId(sub);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const { start, end } = subscriptionBillingPeriod(sub);

  return {
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    plan: options?.planOverride ?? priceIdToPlan(priceId),
    currentPeriodStart: start,
    currentPeriodEnd: end,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    status: mapStripeSubscriptionStatus(sub.status),
    ...(customerId ? { stripeCustomerId: customerId } : {}),
  };
}

/** ID d’abonnement Stripe depuis une facture (API récente : `parent.subscription_details`). */
export function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const parent = inv.parent;
  if (!parent || parent.type !== "subscription_details") return null;
  const sub = parent.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const sub = await prisma.subscription.findUnique({ where: { userId }, select: { stripeCustomerId: true } });
  if (sub?.stripeCustomerId && !sub.stripeCustomerId.startsWith("free_")) return sub.stripeCustomerId;
  const customer = await stripe.customers.create({ email, metadata: { userId } });
  await prisma.subscription.update({ where: { userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createBillingPortalSession(userId: string, returnUrl: string): Promise<string> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });
  if (!subscription?.stripeCustomerId || subscription.stripeCustomerId.startsWith("free_")) {
    throw new Error("No Stripe customer for this user");
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}
