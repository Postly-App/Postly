import type { SocialAccount } from "@prisma/client"
import type { PublishContext } from "../../types"
import { ensureFreshAccessToken } from "../token-refresh"
import {
  fetchWithTimeout,
  PUBLISH_FETCH_TIMEOUT_MS,
  providerHttpErrorFromStatus,
  withPublishRetry,
} from "../retry-policy"

const GRAPH = "https://graph.facebook.com/v18.0"

export async function publishInstagramBusiness(
  account: SocialAccount,
  ctx: PublishContext
): Promise<{ remoteId: string }> {
  const acc = await ensureFreshAccessToken("INSTAGRAM", account)
  const igUserId = acc.accountId
  const token = acc.accessToken

  if (ctx.mediaUrls.length === 0) {
    throw new Error("Instagram Business : au moins une image ou vidéo est requise.")
  }

  const imageUrl = ctx.mediaUrls[0]
  const caption = ctx.content.slice(0, 2200)

  const containerParams = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: token,
  })

  const create = await withPublishRetry(
    async () => {
      const res = await fetchWithTimeout(
        `${GRAPH}/${igUserId}/media?${containerParams.toString()}`,
        { method: "POST" },
        PUBLISH_FETCH_TIMEOUT_MS
      )
      const raw = await res.text()
      if (!res.ok) throw providerHttpErrorFromStatus("Instagram", res.status, raw.slice(0, 400))
      return JSON.parse(raw) as { id?: string; error?: { message: string; code?: string | number } }
    },
    { maxAttempts: 3, baseDelayMs: 600 }
  )

  if (create.error?.message) throw new Error(create.error.message)
  if (!create.id) throw new Error("Instagram : création du conteneur média échouée.")

  const publishParams = new URLSearchParams({
    creation_id: create.id,
    access_token: token,
  })

  const pub = await withPublishRetry(
    async () => {
      const res = await fetchWithTimeout(
        `${GRAPH}/${igUserId}/media_publish?${publishParams.toString()}`,
        { method: "POST" },
        PUBLISH_FETCH_TIMEOUT_MS
      )
      const raw = await res.text()
      if (!res.ok) throw providerHttpErrorFromStatus("Instagram publish", res.status, raw.slice(0, 400))
      return JSON.parse(raw) as { id?: string; error?: { message: string; code?: string | number } }
    },
    { maxAttempts: 3, baseDelayMs: 600 }
  )

  if (pub.error?.message) throw new Error(pub.error.message)
  if (!pub.id) throw new Error("Instagram : publication sans identifiant retourné.")
  return { remoteId: pub.id }
}
