/** Télécharge une URL publique (ex. UploadThing) pour upload côté réseau. */
export async function fetchRemoteMedia(
  url: string,
  maxBytes = 12 * 1024 * 1024
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, { redirect: "follow" })
  if (!res.ok) throw new Error(`Média inaccessible (${res.status})`)
  const len = res.headers.get("content-length")
  if (len && Number(len) > maxBytes) {
    throw new Error("Fichier média trop volumineux pour la publication.")
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > maxBytes) throw new Error("Fichier média trop volumineux pour la publication.")
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream"
  return { buffer: buf, contentType }
}
