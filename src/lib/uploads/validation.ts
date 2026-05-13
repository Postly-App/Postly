/**
 * Validation centralisée des médias (UploadThing + URLs stockées + fetch publication).
 * Aucune donnée sensible dans les messages d’erreur exposés au client.
 */

import { UploadThingError } from "uploadthing/server"
import { logger } from "@/lib/logger"

/** Taille max image (upload + fetch publication). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** Taille max vidéo (upload + fetch publication). */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024

/** Nombre max d’URLs médias par post (cohérent avec le routeur d’upload). */
export const MAX_MEDIA_URLS_PER_POST = 10

export const IMAGE_MIME_ALLOWLIST = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export const VIDEO_MIME_ALLOWLIST = new Set<string>([
  "video/mp4",
  "video/webm",
  "video/quicktime",
])

export const IMAGE_EXT_ALLOWLIST = new Set<string>([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
])

export const VIDEO_EXT_ALLOWLIST = new Set<string>([
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
])

const FORBIDDEN_MIME = new Set<string>([
  "image/svg+xml",
  "application/octet-stream",
  "application/x-msdownload",
  "application/x-executable",
  "application/x-dosexec",
])

/** Réponse JSON API (hors UploadThing). */
export const UPLOAD_ERROR_JSON = {
  code: "MEDIA_VALIDATION_FAILED",
} as const

export class MediaValidationError extends Error {
  readonly code = UPLOAD_ERROR_JSON.code

  constructor(message: string) {
    super(message)
    this.name = "MediaValidationError"
  }
}

export function isMediaValidationError(e: unknown): e is MediaValidationError {
  return e instanceof MediaValidationError
}

function lowerMime(type: string): string {
  return type.split(";")[0]?.trim().toLowerCase() ?? ""
}

export function getFileExtension(filename: string): string {
  const base = filename.replace(/\\/g, "/").split("/").pop() ?? ""
  const i = base.lastIndexOf(".")
  if (i <= 0 || i === base.length - 1) return ""
  return base.slice(i).toLowerCase()
}

/**
 * Nom de fichier sûr pour stockage / métadonnées (anti path traversal, pas de « .. »).
 */
export function normalizeUploadFilename(original: string): string {
  const raw = original.replace(/\\/g, "/").split("/").pop() ?? "file"
  const noDots = raw.replace(/\.\.+/g, "").replace(/^\.+/, "")
  const safe = noDots.replace(/[^\w.\-()+\s]/g, "_").trim()
  const capped = safe.slice(0, 200)
  return capped.length > 0 ? capped : "file"
}

export type UploadFileInit = {
  readonly name: string
  readonly size: number
  readonly type: string
}

function assertNotSvg(name: string, mime: string): void {
  const ext = getFileExtension(name)
  if (ext === ".svg" || mime === "image/svg+xml") {
    throw new MediaValidationError("Le format SVG n’est pas autorisé pour des raisons de sécurité.")
  }
}

function inferMimeFromExtension(ext: string): string | null {
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".png":
      return "image/png"
    case ".webp":
      return "image/webp"
    case ".gif":
      return "image/gif"
    case ".mp4":
    case ".m4v":
      return "video/mp4"
    case ".webm":
      return "video/webm"
    case ".mov":
      return "video/quicktime"
    default:
      return null
  }
}

/**
 * Détermine image vs vidéo à partir des métadonnées client (MIME + extension), avec règles strictes.
 */
export function classifyUploadKindFromClientMeta(file: UploadFileInit): "image" | "video" {
  const ext = getFileExtension(file.name)
  let mime = lowerMime(file.type)

  assertNotSvg(file.name, mime)

  if (FORBIDDEN_MIME.has(mime)) {
    const fromExt = inferMimeFromExtension(ext)
    if (!fromExt || FORBIDDEN_MIME.has(fromExt)) {
      throw new MediaValidationError(
        "Type de fichier non autorisé ou MIME non fiable. Utilisez un format image ou vidéo pris en charge."
      )
    }
    mime = fromExt
  }

  if (IMAGE_MIME_ALLOWLIST.has(mime)) {
    if (ext && !IMAGE_EXT_ALLOWLIST.has(ext)) {
      throw new MediaValidationError(
        "L’extension du fichier ne correspond pas à un type image autorisé."
      )
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new MediaValidationError(`Image trop volumineuse (max ${MAX_IMAGE_BYTES / (1024 * 1024)} Mo).`)
    }
    return "image"
  }

  if (VIDEO_MIME_ALLOWLIST.has(mime)) {
    if (ext && !VIDEO_EXT_ALLOWLIST.has(ext)) {
      throw new MediaValidationError(
        "L’extension du fichier ne correspond pas à un type vidéo autorisé."
      )
    }
    if (file.size > MAX_VIDEO_BYTES) {
      throw new MediaValidationError(`Vidéo trop volumineuse (max ${MAX_VIDEO_BYTES / (1024 * 1024)} Mo).`)
    }
    return "video"
  }

  if (!mime && ext) {
    if (IMAGE_EXT_ALLOWLIST.has(ext)) {
      if (file.size > MAX_IMAGE_BYTES) {
        throw new MediaValidationError(`Image trop volumineuse (max ${MAX_IMAGE_BYTES / (1024 * 1024)} Mo).`)
      }
      return "image"
    }
    if (VIDEO_EXT_ALLOWLIST.has(ext)) {
      if (file.size > MAX_VIDEO_BYTES) {
        throw new MediaValidationError(`Vidéo trop volumineuse (max ${MAX_VIDEO_BYTES / (1024 * 1024)} Mo).`)
      }
      return "video"
    }
  }

  throw new MediaValidationError(
    "Format de média non pris en charge. Types acceptés : JPEG, PNG, WebP, GIF, MP4, WebM, MOV."
  )
}

/**
 * Valide les métadonnées d’upload (taille, MIME, extension, SVG, octet-stream).
 * À appeler depuis le middleware UploadThing sur le nom déjà normalisé.
 */
export function validateUploadFileInit(file: UploadFileInit): void {
  classifyUploadKindFromClientMeta(file)
}

export function throwUploadThingValidation(message: string): never {
  throw new UploadThingError({
    code: "BAD_REQUEST",
    message,
  })
}

/**
 * Log serveur sans URL complète ni contenu fichier.
 */
export function logUploadValidationFailure(scope: string, reason: string): void {
  logger.warn("upload.validation_rejected", {
    route: `upload:${scope}`,
    action: "validation",
    outcome: "rejected",
    reason: reason.slice(0, 500),
  })
}

// ─── Magic bytes ─────────────────────────────────────────────────────────────

export type DetectedBinaryKind = "image" | "video"

export function detectBinaryKindFromMagicBytes(buf: Buffer): DetectedBinaryKind | null {
  if (buf.length < 12) return null

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image"

  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image"
  }

  if (buf.slice(0, 3).toString("ascii") === "GIF") return "image"

  if (
    buf.length >= 12 &&
    buf.slice(0, 4).toString("ascii") === "RIFF" &&
    buf.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image"
  }

  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return "video"
  }

  if (buf.length >= 8 && buf.slice(4, 8).toString("ascii") === "ftyp") {
    return "video"
  }

  return null
}

export function assertMagicMatchesDeclaredKind(
  buf: Buffer,
  declared: "image" | "video"
): void {
  const detected = detectBinaryKindFromMagicBytes(buf)
  if (!detected) {
    throw new MediaValidationError(
      "Signature binaire du fichier non reconnue (fichier exécutable déguisé ou format non supporté)."
    )
  }
  if (detected !== declared) {
    throw new MediaValidationError(
      "Le contenu du fichier ne correspond pas au type déclaré (MIME / extension)."
    )
  }
}

// ─── URLs médias (posts + fetch) ───────────────────────────────────────────

const ALLOWED_MEDIA_HOST_PATTERNS: ReadonlyArray<RegExp> = [
  /^([a-z0-9-]+\.)*utfs\.io$/i,
  /^([a-z0-9-]+\.)*ufs\.sh$/i,
  /^([a-z0-9-]+\.)*uploadthing\.com$/i,
  /^([a-z0-9-]+\.)*uploadthing\.vercel\.app$/i,
]

function hostnameAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return ALLOWED_MEDIA_HOST_PATTERNS.some((re) => re.test(h))
}

/**
 * Vérifie qu’une URL de média stockée ou publiée est sûre (HTTPS, hôte connu, pas de traversal).
 */
export function assertSafePublicMediaUrl(rawUrl: string): URL {
  let u: URL
  try {
    u = new URL(rawUrl)
  } catch {
    throw new MediaValidationError("URL de média invalide.")
  }
  if (u.protocol !== "https:") {
    throw new MediaValidationError("Seules les URLs HTTPS sont autorisées pour les médias.")
  }
  if (!hostnameAllowed(u.hostname)) {
    throw new MediaValidationError("Hôte de média non autorisé.")
  }
  const decoded = decodeURIComponent(u.pathname)
  if (decoded.includes("..") || decoded.includes("\\")) {
    throw new MediaValidationError("Chemin de média invalide.")
  }
  return u
}

export function parseAndValidateMediaUrlList(
  raw: unknown,
  maxUrls: number = MAX_MEDIA_URLS_PER_POST
): string[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) {
    throw new MediaValidationError("mediaUrls doit être un tableau de chaînes.")
  }
  if (raw.length > maxUrls) {
    throw new MediaValidationError(`Trop d’URLs médias (max ${maxUrls}).`)
  }
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== "string" || item.length === 0) {
      throw new MediaValidationError("Chaque entrée de mediaUrls doit être une URL HTTPS non vide.")
    }
    if (item.length > 2048) {
      throw new MediaValidationError("URL de média trop longue.")
    }
    const u = assertSafePublicMediaUrl(item)
    out.push(u.toString())
  }
  return out
}

async function readResponsePrefix(res: Response, maxBytes: number): Promise<Buffer> {
  const reader = res.body?.getReader()
  if (!reader) {
    const ab = await res.arrayBuffer()
    return Buffer.from(ab.slice(0, maxBytes))
  }
  const chunks: Buffer[] = []
  let total = 0
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read()
      if (done || !value) break
      chunks.push(Buffer.from(value))
      total += value.length
    }
  } finally {
    try {
      await reader.cancel()
    } catch {
      /* ignore */
    }
  }
  const out = Buffer.concat(chunks)
  return out.subarray(0, maxBytes)
}

/**
 * Télécharge uniquement un préfixe pour vérifier les magic bytes (UploadThing onUploadComplete).
 */
export async function fetchUrlPrefixForMagicCheck(
  url: string,
  prefixBytes: number,
  timeoutMs: number
): Promise<Buffer> {
  const safe = assertSafePublicMediaUrl(url)
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(safe.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ac.signal,
      headers: { Range: `bytes=0-${prefixBytes - 1}` },
    })
    if (!res.ok && res.status !== 206) {
      throw new MediaValidationError(`Média inaccessible (HTTP ${res.status}).`)
    }
    return await readResponsePrefix(res, prefixBytes)
  } finally {
    clearTimeout(t)
  }
}

/**
 * Vérifie le contenu distant après upload (signature binaire vs type déclaré).
 */
export async function verifyRemoteUploadMagicBytes(
  ufsUrl: string,
  declaredKind: "image" | "video"
): Promise<void> {
  const prefix = await fetchUrlPrefixForMagicCheck(ufsUrl, 64, 15_000)
  assertMagicMatchesDeclaredKind(prefix, declaredKind)
}

// ─── Contenu téléchargé (publication) ──────────────────────────────────────

export type ValidatedMediaBlob = {
  buffer: Buffer
  contentType: string
  kind: "image" | "video"
}

/** MIME déduit uniquement des magic bytes (source de vérité côté serveur). */
export function inferMimeFromMagicBuffer(
  buffer: Buffer,
  kind: "image" | "video"
): string | null {
  if (kind === "image") {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg"
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return "image/png"
    }
    if (buffer.length >= 3 && buffer.slice(0, 3).toString("ascii") === "GIF") {
      return "image/gif"
    }
    if (
      buffer.length >= 12 &&
      buffer.slice(0, 4).toString("ascii") === "RIFF" &&
      buffer.slice(8, 12).toString("ascii") === "WEBP"
    ) {
      return "image/webp"
    }
    return null
  }

  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return "video/webm"
  }
  if (buffer.length >= 12 && buffer.slice(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.slice(8, 12).toString("ascii")
    if (brand === "qt  " || brand === "M4V " || brand.startsWith("M4V")) {
      return "video/quicktime"
    }
    return "video/mp4"
  }
  return null
}

/**
 * Après téléchargement : taille, magic bytes vs type attendu, MIME aligné sur le contenu réel.
 */
export function validateDownloadedMediaContent(
  buffer: Buffer,
  headerContentType: string | null,
  expectedKind: "image" | "video"
): ValidatedMediaBlob {
  const limit = expectedKind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
  if (buffer.length > limit) {
    throw new MediaValidationError("Fichier média trop volumineux pour la publication.")
  }

  assertMagicMatchesDeclaredKind(buffer, expectedKind)

  const inferredMime = inferMimeFromMagicBuffer(buffer, expectedKind)
  if (!inferredMime) {
    throw new MediaValidationError(
      "Type de média non reconnu après téléchargement (fichier dangereux ou corrompu)."
    )
  }

  const headerMime = lowerMime(headerContentType ?? "")
  if (headerMime && headerMime !== "application/octet-stream") {
    if (FORBIDDEN_MIME.has(headerMime) || headerMime === "image/svg+xml") {
      throw new MediaValidationError("Type MIME du média interdit.")
    }
    const headerIsImage = IMAGE_MIME_ALLOWLIST.has(headerMime)
    const headerIsVideo = VIDEO_MIME_ALLOWLIST.has(headerMime)
    if (headerIsImage && expectedKind === "video") {
      throw new MediaValidationError("Le serveur annonce une image alors qu’une vidéo était attendue.")
    }
    if (headerIsVideo && expectedKind === "image") {
      throw new MediaValidationError("Le serveur annonce une vidéo alors qu’une image était attendue.")
    }
    const headerOk =
      (expectedKind === "image" && headerIsImage) ||
      (expectedKind === "video" && headerIsVideo)
    if (headerOk && headerMime !== inferredMime) {
      throw new MediaValidationError(
        "Le type MIME annoncé ne correspond pas au contenu réel du fichier."
      )
    }
  }

  if (expectedKind === "image") {
    if (!IMAGE_MIME_ALLOWLIST.has(inferredMime)) {
      throw new MediaValidationError("Le fichier téléchargé n’est pas une image prise en charge.")
    }
    return { buffer, contentType: inferredMime, kind: "image" }
  }

  if (!VIDEO_MIME_ALLOWLIST.has(inferredMime)) {
    throw new MediaValidationError("Le fichier téléchargé n’est pas une vidéo prise en charge.")
  }
  return { buffer, contentType: inferredMime, kind: "video" }
}
