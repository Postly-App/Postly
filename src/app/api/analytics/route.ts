import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const platform = searchParams.get("platform")
  const days = parseInt(searchParams.get("days") ?? "30")

  const since = new Date()
  since.setDate(since.getDate() - days)

  const analytics = await prisma.analytics.findMany({
    where: {
      userId: session.user.id,
      recordedAt: { gte: since },
      ...(platform ? { platform } : {}),
    },
    orderBy: { recordedAt: "asc" },
  })

  // Totaux agrégés
  const totals = analytics.reduce(
    (acc, a) => ({
      views: acc.views + a.views,
      likes: acc.likes + a.likes,
      comments: acc.comments + a.comments,
      shares: acc.shares + a.shares,
      reach: acc.reach + a.reach,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, reach: 0 }
  )

  // Nombre de posts publiés sur la période
  const publishedCount = await prisma.post.count({
    where: {
      userId: session.user.id,
      status: "PUBLISHED",
      publishedAt: { gte: since },
    },
  })

  return NextResponse.json({ analytics, totals, publishedCount })
}
