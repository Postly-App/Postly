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

const UPLOAD_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status"

const MAX_TITLE = 100
const MAX_DESCRIPTION = 5000

type YouTubeUploadResponse = {
  id?: string
  error?: {
    code?: number
    message?: string
    errors?: { reason?: string; message?: string }[]
  }
}

function extractTitleAndDescription(content: string): { title: string; description: string } {
  const trimmed = content.trim()
  if (!trimmed) {
    return { title: "Postly upload", description: "" }
  }
  const firstLineEnd = trimmed.search(/\r?\n/)
  if (firstLineEnd === -1) {
    return {
      title: trimmed.slice(0, MAX_TITLE),
      description: trimmed.slice(0, MAX_DESCRIPTION),
    }
  }
  const rawTitle = trimmed.slice(0, firstLineEnd).trim() || "Postly upload"
  const rawDescription = trimmed.slice(firstLineEnd + 1).trim()
  return {
    title: rawTitle.slice(0, MAX_TITLE),
    description: rawDescription.slice(0, MAX_DESCRIPTION),
  }
}

export async function publishYouTube(
  account: SocialAccount,
  ctx: PublishContext
): Promise<{ remoteId: string }> {
  const acc = await ensureFreshAccessToken("YOUTUBE", account)
  const token = acc.accessToken

  if (ctx.mediaUrls.length === 0) {
    throw new Error("YouTube : une vidéo est requise pour publier.")
  }

  const { buffer, contentType } = await fetchRemoteMedia(ctx.mediaUrls[0], "video")
  if (!contentType.startsWith("video/")) {
    throw new Error("YouTube : le fichier fourni n’est pas une vidéo.")
  }

  const { title, description } = extractTitleAndDescription(ctx.content)

  const metadata = {
    snippet: {
      title,
      description,
      categoryId: "22",
    },
    status: {
      privacyStatus: "public",
      selfDeclaredMadeForKids: false,
    },
  }

  const boundary = `postly-${Math.random().toString(36).slice(2)}-${Date.now()}`
  const CRLF = "\r\n"
  const parts: Buffer[] = []
  parts.push(
    Buffer.from(
      `--${boundary}${CRLF}` +
        `Content-Type: application/json; charset=UTF-8${CRLF}${CRLF}` +
        JSON.stringify(metadata) +
        CRLF
    )
  )
  parts.push(
    Buffer.from(
      `--${boundary}${CRLF}` +
        `Content-Type: ${contentType}${CRLF}${CRLF}`
    )
  )
  parts.push(buffer)
  parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`))
  const body = Buffer.concat(parts)

  const json = await withPublishRetry(
    async () => {
      const res = await fetchWithTimeout(
        UPLOAD_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
            "Content-Length": String(body.byteLength),
          },
          body: new Uint8Array(body),
        },
        PUBLISH_FETCH_TIMEOUT_MS
      )
      const raw = await res.text()
      if (!res.ok) throw providerHttpErrorFromStatus("YouTube", res.status, raw.slice(0, 400))
      return JSON.parse(raw) as YouTubeUploadResponse
    },
    { maxAttempts: 2, baseDelayMs: 1000 }
  )

  if (json.error?.message) {
    throw new Error(json.error.message)
  }
  if (!json.id) {
    throw new Error("YouTube : pas d’identifiant vidéo retourné.")
  }
  return { remoteId: json.id }
}
