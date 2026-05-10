import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [subscription, socialCount, postsThisMonth] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true, status: true,
        currentPeriodEnd: true, cancelAtPeriodEnd: true,
        trialEnd: true, stripeCustomerId: true,
      },
    }),
    prisma.socialAccount.count({ where: { userId } }),
    prisma.post.count({
      where: { userId, status: "PUBLISHED", publishedAt: { gte: since } },
    }),
  ]);

  const priceIds = {
    proMonthly:    process.env.STRIPE_PRO_MONTHLY_PRICE_ID    ?? "",
    proYearly:     process.env.STRIPE_PRO_YEARLY_PRICE_ID     ?? "",
    agencyMonthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID ?? "",
    agencyYearly:  process.env.STRIPE_AGENCY_YEARLY_PRICE_ID  ?? "",
  };

  const hasStripeCustomer =
    !!subscription?.stripeCustomerId &&
    !subscription.stripeCustomerId.startsWith("free_");

  return (
    <BillingClient
      priceIds={priceIds}
      subscription={
        subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              trialEnd: subscription.trialEnd?.toISOString() ?? null,
            }
          : null
      }
      hasStripeCustomer={hasStripeCustomer}
      usage={{ socialCount, postsThisMonth }}
    />
  );
}
