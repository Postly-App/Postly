import type { SocialAccount } from "@prisma/client"
import type { PublishContext } from "../../types"
import { ensureFreshAccessToken } from "../token-refresh"
import { fetchRemoteMedia } from "../media"
import {
  fetchWithTimeout,
  PUBLISH_FETCH_TIMEOUT_MS,
  providerHttpErrorFromStatus,
  withPublishRetry,
} from "../retry-policy"

const API = "https://api.twitter.com"

async function uploadSimpleImage(accessToken: string, imageUrl: string): Promise<string> {
  const { buffer, contentType } = await fetchRemoteMedia(imageUrl, "image")
  if (!contentType.startsWith("image/")) {
    throw new Error("Twitter : seules les images sont prises en charge pour l’instant.")
  }
  const b64 = buffer.toString("base64")
  const body = new URLSearchParams({
    media_data: b64,
  })
  const res = await fetchWithTimeout(
    `${API}/1.1/media/upload.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
    PUBLISH_FETCH_TIMEOUT_MS
  )
  const text = await res.text()
  if (!res.ok) {
    throw providerHttpErrorFromStatus("Twitter media", res.status, text.slice(0, 400))
  }
  const json = JSON.parse(text) as { media_id_string?: string; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(json.errors[0]?.message ?? "Erreur upload média Twitter")
  if (!json.media_id_string) throw new Error("Twitter : media_id manquant.")
  return json.media_id_string
}

export async function publishTwitter(
  account: SocialAccount,
  ctx: PublishContext
): Promise<{ remoteId: string }> {
  const acc = await ensureFreshAccessToken("TWITTER", account)
  const text = ctx.content.slice(0, 4000)

  const mediaIds: string[] = []
  for (const url of ctx.mediaUrls.slice(0, 4)) {
    mediaIds.push(
      await withPublishRetry(() => uploadSimpleImage(acc.accessToken, url), {
        maxAttempts: 2,
        baseDelayMs: 500,
      })
    )
  }

  const payload: Record<string, unknown> = { text }
  if (mediaIds.length > 0) {
    payload.media = { media_ids: mediaIds }
  }

  const result = await withPublishRetry(
    async () => {
      const res = await fetchWithTimeout(
        `${API}/2/tweets`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${acc.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        PUBLISH_FETCH_TIMEOUT_MS
      )
      const raw = await res.text()
      if (!res.ok) throw providerHttpErrorFromStatus("Twitter", res.status, raw.slice(0, 400))
      return JSON.parse(raw) as {
        data?: { id: string }
        errors?: { detail?: string; title?: string }[]
      }
    },
    { maxAttempts: 3, baseDelayMs: 600 }
  )

  if (result.errors?.length) {
    const d = result.errors.map((e) => e.detail ?? e.title).join(" · ")
    throw new Error(d || "Erreur API Twitter")
  }
  const id = result.data?.id
  if (!id) throw new Error("Twitter : pas d’identifiant de tweet retourné.")
  return { remoteId: id }
}
