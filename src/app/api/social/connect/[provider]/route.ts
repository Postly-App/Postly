import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  normalizePlatformId,
  platformStorageKeys,
} from "@/lib/platforms"

// GET /api/social/connect/[provider] — liste des comptes connectés
export async function GET(
  _req: Request,
  _params: { params: Promise<{ provider: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      platform: true,
      accountName: true,
      createdAt: true,
    },
  })

  return NextResponse.json(
    accounts.map((a) => ({
      ...a,
      platform: normalizePlatformId(a.platform) ?? a.platform,
    }))
  )
}

// POST /api/social/connect/[provider] — connecter un compte
export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { provider } = await params
  const slug = provider.trim().toLowerCase()
  const canonical = normalizePlatformId(slug)
  if (!canonical) {
    return NextResponse.json(
      { error: `Plateforme "${slug}" non supportée.` },
      { status: 400 }
    )
  }

  const { accountId, accountName, accessToken, refreshToken, expiresAt } =
    await req.json()

  if (!accountId || !accountName || !accessToken) {
    return NextResponse.json(
      { error: "accountId, accountName et accessToken sont requis." },
      { status: 400 }
    )
  }

  const keys = platformStorageKeys(canonical)
  await prisma.socialAccount.updateMany({
    where: {
      userId: session.user.id,
      accountId,
      platform: { in: keys.filter((k) => k !== canonical) },
    },
    data: { platform: canonical },
  })

  const tokenData = {
    accessToken,
    refreshToken,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    accountName,
  }

  const account = await prisma.socialAccount.upsert({
    where: {
      userId_platform_accountId: {
        userId: session.user.id,
        platform: canonical,
        accountId,
      },
    },
    update: { ...tokenData, platform: canonical },
    create: {
      userId: session.user.id,
      platform: canonical,
      accountId,
      accountName,
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return NextResponse.json({
    ...account,
    platform: normalizePlatformId(account.platform) ?? account.platform,
  })
}

// DELETE /api/social/connect/[provider] — déconnecter
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { provider } = await params
  const slug = provider.trim().toLowerCase()
  const canonical = normalizePlatformId(slug)
  if (!canonical) {
    return NextResponse.json(
      { error: `Plateforme "${slug}" non supportée.` },
      { status: 400 }
    )
  }

  const { accountId } = await req.json()

  await prisma.socialAccount.deleteMany({
    where: {
      userId: session.user.id,
      platform: { in: platformStorageKeys(canonical) },
      ...(accountId ? { accountId } : {}),
    },
  })

  return NextResponse.json({ success: true })
}
