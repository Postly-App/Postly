/** Télécharge une URL publique (ex. UploadThing) pour upload côté réseau. */

import {
  assertSafePublicMediaUrl,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MediaValidationError,
  validateDownloadedMediaContent,
} from "@/lib/uploads/validation"
import { fetchWithTimeout, MEDIA_FETCH_TIMEOUT_MS } from "./retry-policy"

export async function fetchRemoteMedia(
  url: string,
  expectedKind: "image" | "video" = "image"
): Promise<{ buffer: Buffer; contentType: string }> {
  assertSafePublicMediaUrl(url)

  const res = await fetchWithTimeout(url, { redirect: "follow" }, MEDIA_FETCH_TIMEOUT_MS)
  if (!res.ok) {
    throw new Error(`Média inaccessible (${res.status})`)
  }

  const limit = expectedKind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
  const len = res.headers.get("content-length")
  if (len && Number(len) > limit) {
    throw new MediaValidationError("Fichier média trop volumineux pour la publication.")
  }

  const buf = Buffer.from(await res.arrayBuffer())
  const v = validateDownloadedMediaContent(buf, res.headers.get("content-type"), expectedKind)
  return { buffer: v.buffer, contentType: v.contentType }
}
