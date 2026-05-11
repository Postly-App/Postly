import Stripe from "stripe";
import { prisma } from "./prisma";
import type { SubscriptionStatus } from "@prisma/client";

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

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

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
