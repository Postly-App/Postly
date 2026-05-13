import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { isOauthSlug } from "./oauth-providers"
import { verifyOAuthState } from "./oauth-state"
import { COOKIE_PKCE, COOKIE_STATE, oauthCallbackBaseUrl } from "./run-oauth-connect"
import {
  encryptSocialTokensForPersistence,
  SocialTokenEncryptionConfigurationError,
} from "../social-token-crypto"
import { logger } from "@/lib/logger"

const GRAPH_FB = "https://graph.facebook.com/v18.0"

function redirectSettings(search: string): NextResponse {
  const res = NextResponse.redirect(new URL(`/settings?${search}`, oauthCallbackBaseUrl()))
  res.cookies.delete(COOKIE_STATE)
  res.cookies.delete(COOKIE_PKCE)
  return res
}

async function readFormOrJson(res: Response): Promise<Record<string, unknown>> {
  const ct = res.headers.get("content-type") ?? ""
  const raw = await res.text()
  if (ct.includes("application/json") || raw.trim().startsWith("{")) {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  const u = new URLSearchParams(raw)
  return Object.fromEntries(u.entries())
}

async function exchangeFacebook(code: string, redirectUri: string) {
  const id = process.env.FACEBOOK_CLIENT_ID!
  const sec = process.env.FACEBOOK_CLIENT_SECRET!
  const url = new URL(`${GRAPH_FB}/oauth/access_token`)
  url.searchParams.set("client_id", id)
  url.searchParams.set("client_secret", sec)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("code", code)
  const res = await fetch(url)
  const data = await readFormOrJson(res)
  if (!res.ok) throw new Error(`Facebook token : ${JSON.stringify(data).slice(0, 400)}`)
  const access_token = data.access_token as string | undefined
  if (!access_token) throw new Error("Facebook : access_token manquant.")
  const expires_in = typeof data.expires_in === "string" ? Number(data.expires_in) : (data.expires_in as number | undefined)
  const expiresAt =
    typeof expires_in === "number" && !Number.isNaN(expires_in)
      ? new Date(Date.now() + expires_in * 1000)
      : null
  const ll = new URL(`${GRAPH_FB}/oauth/access_token`)
  ll.searchParams.set("grant_type", "fb_exchange_token")
  ll.searchParams.set("client_id", id)
  ll.searchParams.set("client_secret", sec)
  ll.searchParams.set("fb_exchange_token", access_token)
  const llRes = await fetch(ll)
  const llData = await readFormOrJson(llRes)
  const longToken = (llData.access_token as string | undefined) ?? access_token
  const llExp =
    typeof llData.expires_in === "string"
      ? Number(llData.expires_in)
      : (llData.expires_in as number | undefined)
  const longExp =
    typeof llExp === "number" && !Number.isNaN(llExp)
      ? new Date(Date.now() + llExp * 1000)
      : expiresAt
  return { access_token: longToken, expiresAt: longExp }
}

async function pickFacebookPage(accessToken: string) {
  const url = new URL(`${GRAPH_FB}/me/accounts`)
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account")
  url.searchParams.set("access_token", accessToken)
  const res = await fetch(url)
  const j = (await res.json()) as {
    data?: {
      id: string
      name: string
      access_token: string
      instagram_business_account?: { id: string }
    }[]
    error?: { message: string }
  }
  if (!res.ok || j.error?.message) throw new Error(j.error?.message ?? "Facebook : liste des pages impossible.")
  const first = j.data?.[0]
  if (!first?.access_token) throw new Error("Facebook : aucune page gérée trouvée pour ce compte.")
  return first
}

async function exchangeGoogle(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  })
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const j = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
  }
  if (!res.ok) throw new Error(j.error ?? "Google token échoué.")
  if (!j.access_token) throw new Error("Google : access_token manquant.")
  const expiresAt =
    typeof j.expires_in === "number" ? new Date(Date.now() + j.expires_in * 1000) : null
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? null,
    expiresAt,
  }
}

async function youtubeChannelId(accessToken: string): Promise<{ id: string; title: string }> {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels")
  url.searchParams.set("part", "snippet")
  url.searchParams.set("mine", "true")
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  const j = (await res.json()) as {
    items?: { id: string; snippet?: { title?: string } }[]
    error?: { message: string }
  }
  if (!res.ok || j.error?.message) throw new Error(j.error?.message ?? "YouTube : chaîne introuvable.")
  const ch = j.items?.[0]
  if (!ch?.id) throw new Error("YouTube : aucune chaîne associée au compte.")
  return { id: ch.id, title: ch.snippet?.title ?? ch.id }
}

async function exchangeLinkedIn(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
  })
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const j = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
  }
  if (!res.ok) throw new Error(j.error ?? "LinkedIn token échoué.")
  if (!j.access_token) throw new Error("LinkedIn : access_token manquant.")
  const expiresAt =
    typeof j.expires_in === "number" ? new Date(Date.now() + j.expires_in * 1000) : null
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? null,
    expiresAt,
  }
}

async function linkedinMe(accessToken: string) {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const j = (await res.json()) as { sub?: string; name?: string }
  if (!j.sub) throw new Error("LinkedIn : profil utilisateur introuvable.")
  return { id: j.sub, name: j.name ?? j.sub }
}

async function exchangeTwitter(
  code: string,
  redirectUri: string,
  codeVerifier: string
) {
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: process.env.TWITTER_CLIENT_ID!,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  })
  const id = process.env.TWITTER_CLIENT_ID!
  const sec = process.env.TWITTER_CLIENT_SECRET!
  const basic = Buffer.from(`${id}:${sec}`).toString("base64")
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  })
  const j = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
  }
  if (!res.ok) throw new Error(j.error ?? "Twitter token échoué.")
  if (!j.access_token) throw new Error("Twitter : access_token manquant.")
  const expiresAt =
    typeof j.expires_in === "number" ? new Date(Date.now() + j.expires_in * 1000) : null
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? null,
    expiresAt,
  }
}

async function twitterMe(accessToken: string) {
  const res = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=username",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const j = (await res.json()) as { data?: { id: string; username?: string }; errors?: { detail?: string }[] }
  if (!res.ok || !j.data?.id) {
    const d = j.errors?.map((e) => e.detail).join(" ") ?? "Twitter users/me"
    throw new Error(d)
  }
  return { id: j.data.id, name: j.data.username ?? j.data.id }
}

async function exchangeThreads(code: string, redirectUri: string) {
  const form = new URLSearchParams({
    client_id: process.env.THREADS_CLIENT_ID!,
    client_secret: process.env.THREADS_CLIENT_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  })
  const res = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  })
  const j = (await res.json()) as {
    access_token?: string
    expires_in?: number
    error?: { message: string } | string
  }
  if (!res.ok) {
    const msg = typeof j.error === "object" ? j.error?.message : String(j.error ?? "")
    throw new Error(msg || "Threads token échoué.")
  }
  if (!j.access_token) throw new Error("Threads : access_token manquant.")
  const expiresAt =
    typeof j.expires_in === "number" ? new Date(Date.now() + j.expires_in * 1000) : null
  return { access_token: j.access_token, refresh_token: null as string | null, expiresAt }
}

async function threadsMe(accessToken: string) {
  const url = new URL("https://graph.threads.net/v1.0/me")
  url.searchParams.set("fields", "id,username")
  url.searchParams.set("access_token", accessToken)
  const res = await fetch(url)
  const j = (await res.json()) as { id?: string; username?: string; error?: { message: string } }
  if (!res.ok || j.error?.message) throw new Error(j.error?.message ?? "Threads profil")
  if (!j.id) throw new Error("Threads : id utilisateur manquant.")
  return { id: j.id, name: j.username ?? j.id }
}

async function exchangePinterest(code: string, redirectUri: string) {
  const id = process.env.PINTEREST_CLIENT_ID!
  const sec = process.env.PINTEREST_CLIENT_SECRET!
  const basic = Buffer.from(`${id}:${sec}`).toString("base64")
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  })
  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
  const j = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    message?: string
  }
  if (!res.ok) throw new Error(j.message ?? "Pinterest token échoué.")
  if (!j.access_token) throw new Error("Pinterest : access_token manquant.")
  const expiresAt =
    typeof j.expires_in === "number" ? new Date(Date.now() + j.expires_in * 1000) : null
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? null,
    expiresAt,
  }
}

async function pinterestMe(accessToken: string) {
  const res = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const j = (await res.json()) as { username?: string; id?: string; message?: string }
  if (!res.ok) throw new Error(j.message ?? "Pinterest profil")
  if (!j.username) throw new Error("Pinterest : compte utilisateur introuvable.")
  return { id: j.id ?? j.username, name: j.username }
}

async function exchangeTikTok(code: string, redirectUri: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_key: process.env.TIKTOK_CLIENT_ID,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  })
  const j = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
    message?: string
  }
  if (!res.ok) throw new Error(j.message ?? j.error ?? "TikTok token échoué.")
  if (!j.access_token) throw new Error("TikTok : access_token manquant.")
  const expiresAt =
    typeof j.expires_in === "number" ? new Date(Date.now() + j.expires_in * 1000) : null
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? null,
    expiresAt,
  }
}

async function tiktokUser(accessToken: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const j = (await res.json()) as {
    data?: { user?: { open_id?: string; display_name?: string } }
    error?: { message?: string }
  }
  if (!res.ok || j.error?.message) throw new Error(j.error?.message ?? "TikTok user info")
  const u = j.data?.user
  if (!u?.open_id) throw new Error("TikTok : open_id manquant.")
  return { id: u.open_id, name: u.display_name ?? u.open_id }
}

async function upsertSocial(
  userId: string,
  platform: string,
  accountId: string,
  accountName: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null
) {
  const enc = encryptSocialTokensForPersistence({ accessToken, refreshToken })
  await prisma.socialAccount.upsert({
    where: {
      userId_platform_accountId: { userId, platform, accountId },
    },
    update: {
      accountName,
      accessToken: enc.accessToken,
      refreshToken: enc.refreshToken ?? null,
      expiresAt,
    },
    create: {
      userId,
      platform,
      accountId,
      accountName,
      accessToken: enc.accessToken,
      refreshToken: enc.refreshToken ?? null,
      expiresAt,
    },
  })
}

export async function handleSocialOauthCallback(slug: string, req: Request): Promise<NextResponse> {
  const s = slug.toLowerCase()
  if (!isOauthSlug(s)) {
    return redirectSettings("social_error=unsupported_oauth")
  }

  const url = new URL(req.url)
  const err = url.searchParams.get("error")
  if (err) {
    return redirectSettings(`social_error=${encodeURIComponent(err)}`)
  }
  const code = url.searchParams.get("code")
  const stateQ = url.searchParams.get("state")
  if (!code || !stateQ) {
    return redirectSettings("social_error=missing_code")
  }

  const jar = await cookies()
  const stateCookie = jar.get(COOKIE_STATE)?.value
  if (!stateCookie || stateCookie !== stateQ) {
    return redirectSettings("social_error=invalid_state")
  }

  const payload = verifyOAuthState(stateQ)
  if (!payload || payload.provider !== s) {
    return redirectSettings("social_error=invalid_state")
  }

  const redirectUri = `${oauthCallbackBaseUrl()}/api/auth/${s}/callback`

  try {
    if (s === "twitter") {
      const verifier = jar.get(COOKIE_PKCE)?.value
      if (!verifier) throw new Error("PKCE : cookie code_verifier manquant.")
      const tw = await exchangeTwitter(code, redirectUri, verifier)
      const me = await twitterMe(tw.access_token)
      await upsertSocial(
        payload.userId,
        "TWITTER",
        me.id,
        me.name,
        tw.access_token,
        tw.refresh_token,
        tw.expiresAt
      )
      return redirectSettings(`social_connected=${encodeURIComponent("TWITTER")}`)
    }

    if (s === "facebook") {
      const tok = await exchangeFacebook(code, redirectUri)
      const page = await pickFacebookPage(tok.access_token)
      await upsertSocial(
        payload.userId,
        "FACEBOOK",
        page.id,
        page.name,
        page.access_token,
        null,
        tok.expiresAt
      )
      return redirectSettings("social_connected=FACEBOOK")
    }

    if (s === "instagram") {
      const tok = await exchangeFacebook(code, redirectUri)
      const page = await pickFacebookPage(tok.access_token)
      const ig = page.instagram_business_account?.id
      if (!ig) throw new Error("Aucun compte Instagram Business lié à vos pages Facebook.")
      await upsertSocial(
        payload.userId,
        "INSTAGRAM",
        ig,
        page.name,
        page.access_token,
        null,
        tok.expiresAt
      )
      return redirectSettings("social_connected=INSTAGRAM")
    }

    if (s === "youtube") {
      const tok = await exchangeGoogle(code, redirectUri)
      const ch = await youtubeChannelId(tok.access_token)
      await upsertSocial(
        payload.userId,
        "YOUTUBE",
        ch.id,
        ch.title,
        tok.access_token,
        tok.refresh_token,
        tok.expiresAt
      )
      return redirectSettings("social_connected=YOUTUBE")
    }

    if (s === "linkedin") {
      const tok = await exchangeLinkedIn(code, redirectUri)
      const me = await linkedinMe(tok.access_token)
      await upsertSocial(
        payload.userId,
        "LINKEDIN",
        me.id,
        me.name,
        tok.access_token,
        tok.refresh_token,
        tok.expiresAt
      )
      return redirectSettings("social_connected=LINKEDIN")
    }

    if (s === "threads") {
      const tok = await exchangeThreads(code, redirectUri)
      const me = await threadsMe(tok.access_token)
      await upsertSocial(
        payload.userId,
        "THREADS",
        me.id,
        me.name,
        tok.access_token,
        tok.refresh_token,
        tok.expiresAt
      )
      return redirectSettings("social_connected=THREADS")
    }

    if (s === "pinterest") {
      const tok = await exchangePinterest(code, redirectUri)
      const me = await pinterestMe(tok.access_token)
      await upsertSocial(
        payload.userId,
        "PINTEREST",
        me.id,
        me.name,
        tok.access_token,
        tok.refresh_token,
        tok.expiresAt
      )
      return redirectSettings("social_connected=PINTEREST")
    }

    if (s === "tiktok") {
      const tok = await exchangeTikTok(code, redirectUri)
      const me = await tiktokUser(tok.access_token)
      await upsertSocial(
        payload.userId,
        "TIKTOK",
        me.id,
        me.name,
        tok.access_token,
        tok.refresh_token,
        tok.expiresAt
      )
      return redirectSettings("social_connected=TIKTOK")
    }

    return redirectSettings("social_error=unsupported_oauth")
  } catch (e) {
    if (e instanceof SocialTokenEncryptionConfigurationError) {
      logger.error("oauth.callback.crypto_config", { slug: s, err: e })
      return redirectSettings("social_error=social_token_crypto")
    }
    logger.error("oauth.callback.failed", { slug: s, err: e })
    const msg = e instanceof Error ? e.message : "token_exchange"
    return redirectSettings(`social_error=${encodeURIComponent(msg.slice(0, 240))}`)
  }
}
