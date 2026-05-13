import { NextResponse } from "next/server"
import { OAUTH_CONFIG, isOauthSlug } from "./oauth-providers"
import { newOAuthNonce, signOAuthState } from "./oauth-state"
import { pkceChallengeS256, randomPkceVerifier } from "./oauth-pkce"

const COOKIE_STATE = "postly_oauth_state"
const COOKIE_PKCE = "postly_oauth_pkce"

export function oauthCallbackBaseUrl(): string {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "")
  if (!base) throw new Error("NEXTAUTH_URL manquant.")
  return base
}

export async function runOAuthConnect(slug: string, userId: string): Promise<NextResponse> {
  const s = slug.toLowerCase()
  if (!isOauthSlug(s)) {
    return NextResponse.redirect(
      new URL("/settings?social_error=unsupported_oauth", oauthCallbackBaseUrl())
    )
  }

  const cfg = OAUTH_CONFIG[s]
  const clientId = process.env[cfg.clientIdEnv]?.trim()
  const clientSecret = process.env[cfg.clientSecretEnv]?.trim()
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(
        `/settings?social_error=oauth_missing_config&network=${encodeURIComponent(s)}`,
        oauthCallbackBaseUrl()
      )
    )
  }

  const redirectUri = `${oauthCallbackBaseUrl()}/api/auth/${s}/callback`
  const state = signOAuthState({
    userId,
    provider: s,
    exp: Date.now() + 10 * 60 * 1000,
    nonce: newOAuthNonce(),
  })

  let codeChallenge: string | undefined
  const resCookies: { name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] }[] =
    [
      {
        name: COOKIE_STATE,
        value: state,
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 600,
        },
      },
    ]

  if (cfg.usesPkce) {
    const verifier = randomPkceVerifier()
    codeChallenge = pkceChallengeS256(verifier)
    resCookies.push({
      name: COOKIE_PKCE,
      value: verifier,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      },
    })
  }

  const url = cfg.authorizeUrl({
    clientId,
    redirectUri,
    state,
    scope: cfg.scope,
    codeChallenge,
  })

  const res = NextResponse.redirect(url)
  for (const c of resCookies) {
    res.cookies.set(c.name, c.value, c.options)
  }
  return res
}

export { COOKIE_STATE, COOKIE_PKCE }
