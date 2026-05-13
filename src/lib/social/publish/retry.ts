export interface RetryOptions {
  retries: number
  baseDelayMs: number
  /** Si false, on n’essaie pas à nouveau. */
  shouldRetry?: (err: unknown, attempt: number) => boolean
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { retries: 3, baseDelayMs: 400 }
): Promise<T> {
  const { retries, baseDelayMs, shouldRetry } = options
  let last: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      if (attempt === retries) break
      if (shouldRetry && !shouldRetry(e, attempt)) break
      await sleep(baseDelayMs * 2 ** attempt)
    }
  }
  throw last
}

/** Erreurs HTTP réseau / rate limit — retentir. */
export function isTransientHttpError(e: unknown): boolean {
  if (!(e instanceof Error)) return false
  const m = e.message
  return (
    m.includes("HTTP 429") ||
    m.includes("HTTP 502") ||
    m.includes("HTTP 503") ||
    m.includes("HTTP 504") ||
    m.includes("fetch failed") ||
    m.includes("ECONNRESET")
  )
}
