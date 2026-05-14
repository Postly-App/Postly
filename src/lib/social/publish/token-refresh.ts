import type { SocialAccount } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { PlatformId } from "@/lib/platforms"
import {
  decryptSocialAccountForUse,
  encryptSocialTokensForPersistence,
} from "../social-token-crypto"
import { logger } from "@/lib/logger"
import {
  fetchWithTimeout,
  TOKEN_REFRESH_FETCH_TIMEOUT_MS,
} from "./retry-policy"

const SKEW_MS = 120_000

function isExpired(account: SocialAccount): boolean {
  if (!account.expiresAt) return false
  return account.expiresAt.getTime() <= Date.now() + SKEW_MS
}

async function persistTokens(
  id: string,
  data: { accessToken: string; refreshToken?: string | null; expiresAt?: Date | null }
) {
  const encrypted = encryptSocialTokensForPersistence({
    accessToken: data.accessToken,
    refreshToken:
      data.refreshToken !== undefined ? data.refreshToken : undefined,
  })

  const payload: {
    accessToken: string
    refreshToken?: string | null
    expiresAt?: Date | null
  } = { accessToken: encrypted.accessToken }

  if (data.refreshToken !== undefined) {
    payload.refreshToken = encrypted.refreshToken
  }
  if (data.expiresAt !== undefined) payload.expiresAt = data.expiresAt

  await prisma.socialAccount.update({
    where: { id },
    data: payload,
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

  const res = await fetchWithTimeout(
    "https://api.twitter.com/2/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    TOKEN_REFRESH_FETCH_TIMEOUT_MS
  )
  const raw = await res.text()
  if (!res.ok) {
    logger.warn("social.token_refresh.twitter_http_error", {
      route: "publish:token-refresh",
      platform: "TWITTER",
      status: res.status,
    })
    throw new Error(
      `Twitter token refresh failed (HTTP ${res.status}). Response body is not included to avoid leaking tokens.`
    )
  }

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

async function refreshGoogleYouTube(account: SocialAccount): Promise<SocialAccount> {
  if (!account.refreshToken) throw new Error("YouTube : refresh_token manquant.")
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("YouTube : variables GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquantes.")
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetchWithTimeout(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    TOKEN_REFRESH_FETCH_TIMEOUT_MS
  )
  const raw = await res.text()
  if (!res.ok) {
    logger.warn("social.token_refresh.youtube_http_error", {
      route: "publish:token-refresh",
      platform: "YOUTUBE",
      status: res.status,
    })
    throw new Error(
      `YouTube token refresh failed (HTTP ${res.status}). Response body is not included to avoid leaking tokens.`
    )
  }

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

async function refreshTikTok(account: SocialAccount): Promise<SocialAccount> {
  if (!account.refreshToken) throw new Error("TikTok : refresh_token manquant.")
  const clientKey = process.env.TIKTOK_CLIENT_ID
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) {
    throw new Error("TikTok : variables TIKTOK_CLIENT_ID / TIKTOK_CLIENT_SECRET manquantes.")
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
  })

  const res = await fetchWithTimeout(
    "https://open.tiktokapis.com/v2/oauth/token/",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    TOKEN_REFRESH_FETCH_TIMEOUT_MS
  )
  const raw = await res.text()
  if (!res.ok) {
    logger.warn("social.token_refresh.tiktok_http_error", {
      route: "publish:token-refresh",
      platform: "TIKTOK",
      status: res.status,
    })
    throw new Error(
      `TikTok token refresh failed (HTTP ${res.status}). Response body is not included to avoid leaking tokens.`
    )
  }

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

  const res = await fetchWithTimeout(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    TOKEN_REFRESH_FETCH_TIMEOUT_MS
  )
  const raw = await res.text()
  if (!res.ok) {
    logger.warn("social.token_refresh.linkedin_http_error", {
      route: "publish:token-refresh",
      platform: "LINKEDIN",
      status: res.status,
    })
    throw new Error(
      `LinkedIn token refresh failed (HTTP ${res.status}). Response body is not included to avoid leaking tokens.`
    )
  }

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
  const accountPlain = decryptSocialAccountForUse(account)
  if (!isExpired(accountPlain)) return accountPlain

  switch (platform) {
    case "TWITTER":
      return refreshTwitter(accountPlain)
    case "LINKEDIN":
      return refreshLinkedIn(accountPlain)
    case "YOUTUBE":
      return refreshGoogleYouTube(accountPlain)
    case "TIKTOK":
      return refreshTikTok(accountPlain)
    default:
      return accountPlain
  }
}
