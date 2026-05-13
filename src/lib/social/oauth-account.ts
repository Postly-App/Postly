import type { PlatformId } from "@/lib/platforms"

/**
 * Déduit accountId / accountName après échange de token (schéma SocialAccount).
 * Couverture minimale par plateforme ; les autres flux OAuth doivent utiliser POST /connect.
 */
export async function resolveOAuthSocialAccount(
  platform: PlatformId,
  accessToken: string,
  tokenPayload: Record<string, unknown>
): Promise<{ accountId: string; accountName: string }> {
  switch (platform) {
    case "TWITTER": {
      const res = await fetch(
        "https://api.twitter.com/2/users/me?user.fields=username",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const body = (await res.json()) as {
        data?: { id?: string; username?: string }
        errors?: { message?: string }[]
      }
      const id = body.data?.id
      if (!id) {
        const msg = body.errors?.[0]?.message ?? `HTTP ${res.status}`
        throw new Error(`Twitter users/me: ${msg}`)
      }
      return {
        accountId: id,
        accountName: body.data?.username ?? id,
      }
    }
    case "LINKEDIN": {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const body = (await res.json()) as {
        sub?: string
        name?: string
        given_name?: string
        family_name?: string
      }
      if (!body.sub) throw new Error(`LinkedIn userinfo: HTTP ${res.status}`)
      const name =
        body.name ??
        ([body.given_name, body.family_name].filter(Boolean).join(" ").trim() ||
          body.sub)
      return { accountId: body.sub, accountName: name }
    }
    case "FACEBOOK": {
      const url = new URL("https://graph.facebook.com/me")
      url.searchParams.set("fields", "id,name")
      url.searchParams.set("access_token", accessToken)
      const res = await fetch(url)
      const body = (await res.json()) as { id?: string; name?: string; error?: { message?: string } }
      if (body.error?.message) throw new Error(`Facebook /me: ${body.error.message}`)
      if (!body.id) throw new Error(`Facebook /me: HTTP ${res.status}`)
      return { accountId: body.id, accountName: body.name ?? body.id }
    }
    case "INSTAGRAM": {
      const uid =
        tokenPayload.user_id ?? tokenPayload.userId ?? tokenPayload.sub
      if (uid == null || uid === "") {
        throw new Error("Instagram: user_id absent de la réponse token")
      }
      const username =
        typeof tokenPayload.username === "string"
          ? tokenPayload.username
          : `Instagram ${String(uid)}`
      return { accountId: String(uid), accountName: username }
    }
    default:
      throw new Error(`OAuth callback non implémenté pour ${platform}`)
  }
}
