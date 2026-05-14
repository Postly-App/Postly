import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

/**
 * Export RGPD : retourne un JSON de toutes les données personnelles
 * de l'utilisateur connecté. Aucun token social (chiffré) n'est exposé.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const [user, posts, socialAccounts, subscription, analytics, apiKeys, teamMemberships, ownedTeams] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            storageBytes: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.post.findMany({
          where: { userId },
          select: {
            id: true,
            content: true,
            mediaUrls: true,
            platforms: true,
            status: true,
            scheduledAt: true,
            publishedAt: true,
            createdAt: true,
          },
        }),
        prisma.socialAccount.findMany({
          where: { userId },
          select: {
            platform: true,
            accountId: true,
            accountName: true,
            expiresAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.subscription.findUnique({
          where: { userId },
          select: {
            plan: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            trialEnd: true,
            cancelAtPeriodEnd: true,
            createdAt: true,
          },
        }),
        prisma.analytics.findMany({
          where: { userId },
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
        prisma.apiKey.findMany({
          where: { userId },
          select: {
            name: true,
            prefix: true,
            lastUsedAt: true,
            expiresAt: true,
            createdAt: true,
          },
        }),
        prisma.teamMember.findMany({
          where: { userId },
          select: {
            role: true,
            acceptedAt: true,
            createdAt: true,
            team: { select: { id: true, name: true } },
          },
        }),
        prisma.team.findMany({
          where: { ownerId: userId },
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: { select: { members: true, clients: true } },
          },
        }),
      ])

    const data = {
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",
      note: "Conformément au RGPD, ce fichier contient toutes les données personnelles associées à votre compte Postly. Les jetons OAuth des réseaux sociaux sont stockés chiffrés et ne sont pas exposés ici.",
      user,
      subscription,
      posts: { count: posts.length, items: posts.map((p) => ({ ...p, storageBytesDisclaimer: undefined })) },
      socialAccounts: { count: socialAccounts.length, items: socialAccounts },
      analytics: { count: analytics.length, items: analytics },
      apiKeys: { count: apiKeys.length, items: apiKeys },
      teamMemberships: { count: teamMemberships.length, items: teamMemberships },
      ownedTeams: { count: ownedTeams.length, items: ownedTeams },
    }

    logger.audit("user.data_exported", { route: "/api/user/export", userId })

    const filename = `postly-export-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`
    return new NextResponse(JSON.stringify(data, replacer, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    logger.error("user.export_failed", { route: "/api/user/export", userId, err })
    return NextResponse.json({ error: "Export impossible." }, { status: 500 })
  }
}

// JSON.stringify ne sait pas sérialiser les BigInt par défaut.
function replacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString()
  return value
}
