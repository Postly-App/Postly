import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  normalizePlatformId,
  platformStorageKeys,
} from "@/lib/platforms"

const SUPPORTED_PLATFORMS = [
  "instagram",
  "tiktok",
  "twitter",
  "linkedin",
  "youtube",
  "facebook",
  "threads",
  "pinterest",
  "bluesky",
]

// GET /api/social/connect/[provider] — liste des comptes connectés
export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      platform: true,
      accountName: true,
      createdAt: true,
    },
  })

  return NextResponse.json(accounts)
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
  const slug = provider.toLowerCase()

  if (!SUPPORTED_PLATFORMS.includes(slug)) {
    return NextResponse.json(
      { error: `Plateforme "${slug}" non supportée.` },
      { status: 400 }
    )
  }

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
  const existing = await prisma.socialAccount.findFirst({
    where: {
      userId: session.user.id,
      accountId,
      platform: { in: keys },
    },
  })

  const tokenData = {
    accessToken,
    refreshToken,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    accountName,
  }

  const account = existing
    ? await prisma.socialAccount.update({
        where: { id: existing.id },
        data: { ...tokenData, platform: canonical },
      })
    : await prisma.socialAccount.create({
        data: {
          userId: session.user.id,
          platform: canonical,
          accountId,
          accountName,
          accessToken,
          refreshToken,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      })

  return NextResponse.json(account)
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
  const slug = provider.toLowerCase()
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
