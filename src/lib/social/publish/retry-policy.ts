import { MediaValidationError } from "@/lib/uploads/validation"
import { isSocialTokenCryptoError } from "../social-token-crypto"

/** Timeout fetch publication (réseaux sociaux + graph). */
export const PUBLISH_FETCH_TIMEOUT_MS = 28_000

/** Timeout téléchargement média distant (UploadThing → buffer). */
export const MEDIA_FETCH_TIMEOUT_MS = 25_000

/** Timeout refresh OAuth Twitter/LinkedIn. */
export const TOKEN_REFRESH_FETCH_TIMEOUT_MS = 15_000

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class ProviderHttpError extends Error {
  readonly providerStatusCode: number
  readonly retryable: boolean
  readonly providerErrorCode?: string

  constructor(
    message: string,
    providerStatusCode: number,
    retryable: boolean,
    providerErrorCode?: string
  ) {
    super(message)
    this.name = "ProviderHttpError"
    this.providerStatusCode = providerStatusCode
    this.retryable = retryable
    this.providerErrorCode = providerErrorCode
  }
}

function httpRetryableByStatus(status: number): boolean {
  if (status === 408 || status === 425) return true
  if (status === 429) return true
  if (status >= 500 && status <= 599) return true
  return false
}

function httpExplicitlyNonRetryable(status: number): boolean {
  if (status === 401 || status === 403) return true
  if (status === 400 || status === 404 || status === 405 || status === 413 || status === 422) return true
  return false
}

export function providerHttpErrorFromStatus(
  label: string,
  status: number,
  detail?: string
): ProviderHttpError {
  const retryable = httpRetryableByStatus(status) && !httpExplicitlyNonRetryable(status)
  const hint = detail?.trim() ? `: ${detail.trim().slice(0, 400)}` : ""
  return new ProviderHttpError(`${label} HTTP ${status}${hint}`, status, retryable)
}

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number
): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t))
}

export interface PublishRetryOptions {
  /** Nombre total de tentatives (1 = pas de retry). */
  maxAttempts: number
  baseDelayMs: number
  shouldRetry?: (err: unknown, attemptIndex: number) => boolean
}

const defaultShouldRetry = (err: unknown) => isRetryablePublishError(err)

/**
 * Retry centralisé pour appels réseau publication : 429 / 5xx / timeouts / erreurs réseau.
 * N’essaie pas à nouveau sur auth, média invalide, erreurs Prisma, etc.
 */
export async function withPublishRetry<T>(
  fn: () => Promise<T>,
  options: PublishRetryOptions
): Promise<T> {
  const { maxAttempts, baseDelayMs, shouldRetry = defaultShouldRetry } = options
  let last: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      if (attempt === maxAttempts - 1) break
      if (!shouldRetry(e, attempt)) break
      await sleep(baseDelayMs * 2 ** attempt)
    }
  }
  throw last
}

export function isRetryablePublishError(err: unknown): boolean {
  if (err instanceof ProviderHttpError) return err.retryable
  if (err instanceof MediaValidationError) return false
  if (isSocialTokenCryptoError(err)) return false
  if (!(err instanceof Error)) return false
  const m = err.message
  if (m.includes("HTTP 401") || m.includes("HTTP 403")) return false
  if (m.includes("HTTP 400") || m.includes("HTTP 404") || m.includes("HTTP 422")) return false
  if (m.includes("HTTP 413")) return false
  if (m.includes("HTTP 429")) return true
  const http5 = /HTTP\s(50[234]|408)/.exec(m)
  if (http5) return true
  if (m.includes("fetch failed")) return true
  if (m.includes("ECONNRESET") || m.includes("ETIMEDOUT") || m.includes("ENOTFOUND")) return true
  if (m.includes("AbortError") || m.includes("aborted") || err.name === "AbortError") return true
  return false
}

/** Extrait un code HTTP d’un message d’erreur legacy (`Twitter HTTP 502 : …`). */
export function parseHttpStatusFromMessage(err: unknown): number | undefined {
  if (!(err instanceof Error)) return undefined
  const m = /HTTP\s(\d{3})/.exec(err.message)
  return m ? Number(m[1]) : undefined
}

/** Champs uniformisés pour PublishResult à partir d’une erreur provider. */
export function publishErrorMeta(err: unknown): {
  retryable?: boolean
  providerStatusCode?: number
  providerErrorCode?: string
} {
  if (err instanceof ProviderHttpError) {
    return {
      retryable: err.retryable,
      providerStatusCode: err.providerStatusCode,
      providerErrorCode: err.providerErrorCode,
    }
  }
  const code = parseHttpStatusFromMessage(err)
  if (code != null) {
    return {
      providerStatusCode: code,
      retryable: isRetryablePublishError(err),
    }
  }
  return { retryable: isRetryablePublishError(err) }
}
