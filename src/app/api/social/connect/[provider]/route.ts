import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  normalizePlatformId,
  platformStorageKeys,
} from "@/lib/platforms"
import {
  encryptSocialTokensForPersistence,
  SocialTokenEncryptionConfigurationError,
  logSocialTokenCryptoFailure,
} from "@/lib/social/social-token-crypto"
import { checkCanAddSocialAccount } from "@/lib/plan-limits"

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

  const existing = await prisma.socialAccount.findUnique({
    where: {
      userId_platform_accountId: {
        userId: session.user.id,
        platform: canonical,
        accountId,
      },
    },
    select: { id: true },
  })

  if (!existing) {
    const check = await checkCanAddSocialAccount(session.user.id)
    if (!check.allowed) {
      return NextResponse.json(
        { error: check.reason, code: "PLAN_LIMIT_REACHED", limit: check.limit, current: check.current, plan: check.plan },
        { status: 402 }
      )
    }
  }

  let encrypted: ReturnType<typeof encryptSocialTokensForPersistence>
  try {
    encrypted = encryptSocialTokensForPersistence({
      accessToken,
      refreshToken: refreshToken ?? null,
    })
  } catch (e) {
    if (e instanceof SocialTokenEncryptionConfigurationError) {
      logSocialTokenCryptoFailure("social-connect", e)
      return NextResponse.json({ error: e.message }, { status: 503 })
    }
    throw e
  }

  const tokenData = {
    ...encrypted,
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
      accessToken: encrypted.accessToken,
      refreshToken: encrypted.refreshToken ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return NextResponse.json({
    id: account.id,
    userId: account.userId,
    platform: normalizePlatformId(account.platform) ?? account.platform,
    accountId: account.accountId,
    accountName: account.accountName,
    expiresAt: account.expiresAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
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
