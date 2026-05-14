import type { SocialAccount } from "@prisma/client"
import type { PublishContext } from "../../types"
import { ensureFreshAccessToken } from "../token-refresh"
import {
  fetchWithTimeout,
  PUBLISH_FETCH_TIMEOUT_MS,
  providerHttpErrorFromStatus,
  withPublishRetry,
} from "../retry-policy"

const API = "https://open.tiktokapis.com/v2"

type TikTokInitResponse = {
  data?: {
    publish_id?: string
  }
  error?: {
    code?: string
    message?: string
  }
}

type TikTokStatusResponse = {
  data?: {
    status?: string
    publicaly_available_post_id?: string[]
    fail_reason?: string
  }
  error?: {
    code?: string
    message?: string
  }
}

async function pollPublishStatus(
  accessToken: string,
  publishId: string
): Promise<{ remoteId: string }> {
  const maxAttempts = 12
  const delayMs = 2500
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs))
    const res = await fetchWithTimeout(
      `${API}/post/publish/status/fetch/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publish_id: publishId }),
      },
      PUBLISH_FETCH_TIMEOUT_MS
    )
    const raw = await res.text()
    if (!res.ok) {
      throw providerHttpErrorFromStatus("TikTok status", res.status, raw.slice(0, 400))
    }
    const json = JSON.parse(raw) as TikTokStatusResponse
    if (json.error?.code && json.error.code !== "ok") {
      throw new Error(json.error.message ?? "TikTok : erreur statut publication.")
    }
    const status = json.data?.status
    if (status === "PUBLISH_COMPLETE") {
      const ids = json.data?.publicaly_available_post_id
      return { remoteId: ids?.[0] ?? publishId }
    }
    if (status === "FAILED") {
      throw new Error(json.data?.fail_reason ?? "TikTok : publication échouée.")
    }
  }
  return { remoteId: publishId }
}

export async function publishTikTok(
  account: SocialAccount,
  ctx: PublishContext
): Promise<{ remoteId: string }> {
  const acc = await ensureFreshAccessToken("TIKTOK", account)
  const token = acc.accessToken

  if (ctx.mediaUrls.length === 0) {
    throw new Error("TikTok : une vidéo est requise pour publier.")
  }

  const videoUrl = ctx.mediaUrls[0]
  const title = ctx.content.slice(0, 2200)

  const initBody = {
    post_info: {
      title,
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: {
      source: "PULL_FROM_URL",
      video_url: videoUrl,
    },
  }

  const init = await withPublishRetry(
    async () => {
      const res = await fetchWithTimeout(
        `${API}/post/publish/video/init/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(initBody),
        },
        PUBLISH_FETCH_TIMEOUT_MS
      )
      const raw = await res.text()
      if (!res.ok) throw providerHttpErrorFromStatus("TikTok", res.status, raw.slice(0, 400))
      return JSON.parse(raw) as TikTokInitResponse
    },
    { maxAttempts: 3, baseDelayMs: 600 }
  )

  if (init.error?.code && init.error.code !== "ok") {
    throw new Error(init.error.message ?? "TikTok : erreur initialisation.")
  }
  const publishId = init.data?.publish_id
  if (!publishId) {
    throw new Error("TikTok : pas de publish_id retourné.")
  }

  return pollPublishStatus(token, publishId)
}
