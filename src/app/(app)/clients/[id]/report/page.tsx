import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getUserTeamRole } from "@/lib/team"
import { getUserActivePlan, PLAN_LIMITS } from "@/lib/plan-limits"
import ReportClient from "./ReportClient"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{ days?: string }>

export default async function ClientReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const plan = await getUserActivePlan(session.user.id)
  if (!PLAN_LIMITS[plan].whiteLabel) {
    redirect("/billing")
  }

  const { id } = await params
  const sp = await searchParams
  const days = Math.min(365, Math.max(7, Number(sp.days ?? "30") || 30))

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      team: { select: { id: true, name: true } },
    },
  })
  if (!client) return notFound()

  const role = await getUserTeamRole(session.user.id, client.team.id)
  if (role === "none") return notFound()

  const since = new Date()
  since.setDate(since.getDate() - days)

  const [posts, analytics] = await Promise.all([
    prisma.post.findMany({
      where: {
        clientId: id,
        publishedAt: { gte: since },
        status: "PUBLISHED",
      },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        content: true,
        platforms: true,
        publishedAt: true,
      },
    }),
    prisma.analytics.findMany({
      where: {
        post: { clientId: id },
        recordedAt: { gte: since },
      },
      select: {
        platform: true,
        views: true,
        likes: true,
        comments: true,
        shares: true,
        reach: true,
        recordedAt: true,
      },
    }),
  ])

  const totals = analytics.reduce(
    (acc, a) => ({
      reach: acc.reach + a.reach,
      views: acc.views + a.views,
      likes: acc.likes + a.likes,
      comments: acc.comments + a.comments,
      shares: acc.shares + a.shares,
    }),
    { reach: 0, views: 0, likes: 0, comments: 0, shares: 0 }
  )

  const byPlatform = new Map<string, { reach: number; engagement: number }>()
  for (const a of analytics) {
    const cur = byPlatform.get(a.platform) ?? { reach: 0, engagement: 0 }
    cur.reach += a.reach
    cur.engagement += a.likes + a.comments + a.shares
    byPlatform.set(a.platform, cur)
  }

  return (
    <ReportClient
      client={{
        id: client.id,
        name: client.name,
        brandColor: client.brandColor,
        logoUrl: client.logoUrl,
      }}
      teamName={client.team.name}
      days={days}
      generatedAt={new Date().toISOString()}
      totals={totals}
      postsCount={posts.length}
      posts={posts.map((p) => ({
        id: p.id,
        content: p.content.slice(0, 200),
        platforms: p.platforms,
        publishedAt: p.publishedAt?.toISOString() ?? null,
      }))}
      byPlatform={Array.from(byPlatform.entries())
        .map(([platform, v]) => ({ platform, reach: v.reach, engagement: v.engagement }))
        .sort((a, b) => b.reach - a.reach)}
    />
  )
}
