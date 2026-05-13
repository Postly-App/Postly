import type { SocialAccount } from "@prisma/client"
import type { PublishContext } from "../../types"
import { ensureFreshAccessToken } from "../token-refresh"
import { fetchRemoteMedia } from "../media"
import { withRetry } from "../retry"

const GRAPH = "https://graph.facebook.com/v18.0"

export async function publishFacebookPage(
  account: SocialAccount,
  ctx: PublishContext
): Promise<{ remoteId: string }> {
  const acc = await ensureFreshAccessToken("FACEBOOK", account)
  const pageId = acc.accountId
  const token = acc.accessToken

  if (ctx.mediaUrls.length > 0) {
    const { buffer, contentType } = await fetchRemoteMedia(ctx.mediaUrls[0], 8 * 1024 * 1024)
    const form = new FormData()
    form.set("access_token", token)
    form.set("message", ctx.content.slice(0, 8000))
    form.set("source", new Blob([new Uint8Array(buffer)], { type: contentType }))

    const json = await withRetry(
      async () => {
        const res = await fetch(`${GRAPH}/${pageId}/photos`, { method: "POST", body: form })
        const text = await res.text()
        if (!res.ok) throw new Error(`Facebook photos HTTP ${res.status} : ${text.slice(0, 800)}`)
        return JSON.parse(text) as { id?: string; post_id?: string; error?: { message: string } }
      },
      { retries: 2, baseDelayMs: 500 }
    )
    if (json.error?.message) throw new Error(json.error.message)
    const id = json.post_id ?? json.id
    if (!id) throw new Error("Facebook : pas d’identifiant de publication retourné.")
    return { remoteId: id }
  }

  const json = await withRetry(
    async () => {
      const params = new URLSearchParams({
        access_token: token,
        message: ctx.content.slice(0, 8000),
      })
      const res = await fetch(`${GRAPH}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      })
      const text = await res.text()
      if (!res.ok) throw new Error(`Facebook feed HTTP ${res.status} : ${text.slice(0, 800)}`)
      return JSON.parse(text) as { id?: string; error?: { message: string } }
    },
    { retries: 2, baseDelayMs: 500 }
  )

  if (json.error?.message) throw new Error(json.error.message)
  if (!json.id) throw new Error("Facebook : pas d’identifiant de publication retourné.")
  return { remoteId: json.id }
}
