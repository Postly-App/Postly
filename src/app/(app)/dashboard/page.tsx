import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserPosts } from "@/lib/db/posts";
import { normalizePlatformId } from "@/lib/platforms";
import { prisma } from "@/lib/prisma";
import { isAiChatConfigured } from "@/lib/ai/chat";
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits";
import { loadUserAnalyticsInsights } from "@/lib/analytics-insights";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const plan = await getUserActivePlan(userId);
  const planAiEnabled = PLAN_LIMITS[plan].aiAssistant;

  const [
    recentPosts,
    scheduledCount,
    publishedCount,
    totals,
    connectedAccounts,
    insights,
    upcomingPosts,
    activityPosts,
  ] = await Promise.all([
    getUserPosts(userId, { limit: 8 }),
    prisma.post.count({ where: { userId, status: "SCHEDULED" } }),
    prisma.post.count({ where: { userId, status: "PUBLISHED", publishedAt: { gte: since } } }),
    prisma.analytics.aggregate({
      where: { userId, recordedAt: { gte: since } },
      _sum: { reach: true, likes: true, comments: true, views: true, shares: true },
    }),
    prisma.socialAccount.findMany({
      where: { userId },
      select: { platform: true, accountName: true, accountId: true },
      orderBy: { updatedAt: "desc" },
    }),
    loadUserAnalyticsInsights(userId, 30),
    prisma.post.findMany({
      where: { userId, status: "SCHEDULED", scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 8,
      select: { id: true, content: true, platforms: true, scheduledAt: true },
    }),
    prisma.post.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        platforms: true,
        content: true,
        createdAt: true,
        publishedAt: true,
        scheduledAt: true,
      },
    }),
  ]);

  const normalizedAccounts = connectedAccounts.map((a) => ({
    ...a,
    platform: normalizePlatformId(a.platform) ?? a.platform,
  }));

  const totalReach    = totals._sum.reach    ?? 0;
  const totalLikes    = totals._sum.likes    ?? 0;
  const totalComments = totals._sum.comments ?? 0;
  const totalViews    = totals._sum.views    ?? 0;
  const engagementBase = totalReach || totalViews;
  const avgEngagementRate = engagementBase > 0
    ? ((totalLikes + totalComments) / engagementBase) * 100
    : 0;

  const analytics = {
    totalReach,
    avgEngagementRate,
    scheduledPosts: scheduledCount,
    publishedPosts: publishedCount,
    totalLikes,
    totalComments,
  };

  const upcoming = upcomingPosts.map((p) => ({
    id: p.id,
    content: p.content,
    platforms: p.platforms.map((pl) => normalizePlatformId(pl) ?? pl),
    scheduledAt: p.scheduledAt!.toISOString(),
  }));

  const activity = activityPosts.map((p) => ({
    id: p.id,
    status: p.status,
    platforms: p.platforms.map((pl) => normalizePlatformId(pl) ?? pl),
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    publishedAt: p.publishedAt?.toISOString() ?? null,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
  }));

  return (
    <DashboardClient
      analytics={analytics}
      recentPosts={recentPosts}
      connectedAccounts={normalizedAccounts}
      user={session.user}
      aiChatEnabled={isAiChatConfigured() && planAiEnabled}
      plan={plan}
      heatmap={insights.heatmap}
      bestSlots={insights.bestSlots}
      topPlatforms={insights.topPlatforms}
      hasAnalytics={insights.hasData}
      upcoming={upcoming}
      activity={activity}
    />
  );
}
