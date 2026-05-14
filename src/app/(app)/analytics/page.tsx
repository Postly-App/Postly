import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const plan = await getUserActivePlan(userId);
  const advanced = PLAN_LIMITS[plan].advancedAnalytics;

  // FREE = 7j max, PRO/AGENCY = 90j
  const maxDays = advanced ? 90 : 7;
  const since = new Date();
  since.setDate(since.getDate() - maxDays);

  const [rows, publishedCount] = await Promise.all([
    prisma.analytics.findMany({
      where: { userId, recordedAt: { gte: since } },
      orderBy: { recordedAt: "asc" },
      select: {
        platform: true, views: true, likes: true, comments: true,
        shares: true, reach: true, recordedAt: true,
      },
    }),
    prisma.post.count({
      where: { userId, status: "PUBLISHED", publishedAt: { gte: since } },
    }),
  ]);

  return (
    <AnalyticsClient
      rows={rows.map((r) => ({ ...r, recordedAt: r.recordedAt.toISOString() }))}
      publishedCount={publishedCount}
      advanced={advanced}
    />
  );
}
