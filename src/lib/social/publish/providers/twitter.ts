import type { SocialAccount } from "@prisma/client"
import type { PublishContext } from "../../types"
import { ensureFreshAccessToken } from "../token-refresh"
import { fetchRemoteMedia } from "../media"
import { withRetry } from "../retry"

const API = "https://api.twitter.com"

async function uploadSimpleImage(accessToken: string, imageUrl: string): Promise<string> {
  const { buffer, contentType } = await fetchRemoteMedia(imageUrl, 5 * 1024 * 1024)
  if (!contentType.startsWith("image/")) {
    throw new Error("Twitter : seules les images sont prises en charge pour l’instant.")
  }
  const b64 = buffer.toString("base64")
  const body = new URLSearchParams({
    media_data: b64,
  })
  const res = await fetch(`${API}/1.1/media/upload.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Twitter media HTTP ${res.status} : ${text.slice(0, 600)}`)
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
    mediaIds.push(await uploadSimpleImage(acc.accessToken, url))
  }

  const payload: Record<string, unknown> = { text }
  if (mediaIds.length > 0) {
    payload.media = { media_ids: mediaIds }
  }

  const result = await withRetry(
    async () => {
      const res = await fetch(`${API}/2/tweets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${acc.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const raw = await res.text()
      if (!res.ok) throw new Error(`Twitter HTTP ${res.status} : ${raw.slice(0, 800)}`)
      return JSON.parse(raw) as {
        data?: { id: string }
        errors?: { detail?: string; title?: string }[]
      }
    },
    { retries: 2, baseDelayMs: 600 }
  )

  if (result.errors?.length) {
    const d = result.errors.map((e) => e.detail ?? e.title).join(" · ")
    throw new Error(d || "Erreur API Twitter")
  }
  const id = result.data?.id
  if (!id) throw new Error("Twitter : pas d’identifiant de tweet retourné.")
  return { remoteId: id }
}
