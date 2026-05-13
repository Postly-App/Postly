import type { SocialAccount } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { PlatformId } from "@/lib/platforms"

const SKEW_MS = 120_000

function isExpired(account: SocialAccount): boolean {
  if (!account.expiresAt) return false
  return account.expiresAt.getTime() <= Date.now() + SKEW_MS
}

async function persistTokens(
  id: string,
  data: { accessToken: string; refreshToken?: string | null; expiresAt?: Date | null }
) {
  await prisma.socialAccount.update({
    where: { id },
    data: {
      accessToken: data.accessToken,
      ...(data.refreshToken !== undefined ? { refreshToken: data.refreshToken } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
    },
  })
}

async function refreshTwitter(account: SocialAccount): Promise<SocialAccount> {
  if (!account.refreshToken) throw new Error("Twitter : refresh_token manquant.")
  const clientId = process.env.TWITTER_CLIENT_ID
  if (!clientId) throw new Error("Twitter : TWITTER_CLIENT_ID manquant côté serveur.")

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
    client_id: clientId,
  })
  const secret = process.env.TWITTER_CLIENT_SECRET
  if (secret) {
    body.set("client_secret", secret)
  }

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const raw = await res.text()
  if (!res.ok) throw new Error(`Twitter token refresh : ${raw.slice(0, 500)}`)

  const json = JSON.parse(raw) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }
  const expiresAt =
    typeof json.expires_in === "number"
      ? new Date(Date.now() + json.expires_in * 1000)
      : null

  await persistTokens(account.id, {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? account.refreshToken,
    expiresAt,
  })

  return {
    ...account,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? account.refreshToken,
    expiresAt,
  }
}

async function refreshLinkedIn(account: SocialAccount): Promise<SocialAccount> {
  if (!account.refreshToken) throw new Error("LinkedIn : refresh_token manquant.")
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn : variables LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET manquantes.")
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const raw = await res.text()
  if (!res.ok) throw new Error(`LinkedIn token refresh : ${raw.slice(0, 500)}`)

  const json = JSON.parse(raw) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }
  const expiresAt =
    typeof json.expires_in === "number"
      ? new Date(Date.now() + json.expires_in * 1000)
      : null

  await persistTokens(account.id, {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? account.refreshToken,
    expiresAt,
  })

  return {
    ...account,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? account.refreshToken,
    expiresAt,
  }
}

/**
 * Rafraîchit le jeton si proche de l’expiration et persiste en base.
 * Facebook / Instagram / Threads reposent souvent sur des jetons longue durée : pas de refresh ici.
 */
export async function ensureFreshAccessToken(
  platform: PlatformId,
  account: SocialAccount
): Promise<SocialAccount> {
  if (!isExpired(account)) return account

  switch (platform) {
    case "TWITTER":
      return refreshTwitter(account)
    case "LINKEDIN":
      return refreshLinkedIn(account)
    default:
      return account
  }
}
