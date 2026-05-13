export { RATE_LIMITS } from "./limits"
export { getClientIp, getClientIpFromHeaders } from "./ip"
export { getRedis, isRateLimitDisabled, warnIfRedisMissing } from "./redis"
export { jsonRateLimited, rateLimitHeaders, type RateLimitResult } from "./response"
export { createLimiters, type AppLimiters } from "./limiters"

import type { Ratelimit } from "@upstash/ratelimit"
import { NextResponse } from "next/server"
import { createLimiters } from "./limiters"
import { getRedis, isRateLimitDisabled, warnIfRedisMissing } from "./redis"
import { jsonRateLimited } from "./response"

let limiters: ReturnType<typeof createLimiters> | null | undefined

function getLimiters(): ReturnType<typeof createLimiters> | null {
  if (limiters !== undefined) return limiters
  const redis = getRedis()
  if (!redis) {
    limiters = null
    return null
  }
  limiters = createLimiters(redis)
  return limiters
}

/**
 * Applique un quota. Retourne une réponse 429 JSON si dépassé, sinon null.
 */
export async function enforceRateLimit(
  bucket: keyof ReturnType<typeof createLimiters>,
  identifier: string,
  messageFr: string
): Promise<NextResponse | null> {
  if (isRateLimitDisabled()) return null

  const L = getLimiters()
  if (!L) {
    warnIfRedisMissing(bucket)
    return null
  }

  const limiter = L[bucket] as Ratelimit
  const result = await limiter.limit(identifier)
  if (result.success) return null

  return jsonRateLimited(result, {
    error: messageFr,
    code: "RATE_LIMITED",
  })
}
