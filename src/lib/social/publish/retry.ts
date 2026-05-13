import { isRetryablePublishError, withPublishRetry } from "./retry-policy"

export {
  fetchWithTimeout,
  isRetryablePublishError,
  parseHttpStatusFromMessage,
  providerHttpErrorFromStatus,
  ProviderHttpError,
  publishErrorMeta,
  withPublishRetry,
  MEDIA_FETCH_TIMEOUT_MS,
  PUBLISH_FETCH_TIMEOUT_MS,
  TOKEN_REFRESH_FETCH_TIMEOUT_MS,
} from "./retry-policy"

export interface RetryOptions {
  retries: number
  baseDelayMs: number
  shouldRetry?: (err: unknown, attempt: number) => boolean
}

/** Compatibilité : préférer withPublishRetry + retry-policy. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { retries: 3, baseDelayMs: 400 }
): Promise<T> {
  const { retries, baseDelayMs, shouldRetry } = options
  return withPublishRetry(fn, {
    maxAttempts: retries + 1,
    baseDelayMs,
    shouldRetry,
  })
}

/** @deprecated Utiliser isRetryablePublishError. */
export function isTransientHttpError(e: unknown): boolean {
  return isRetryablePublishError(e)
}
