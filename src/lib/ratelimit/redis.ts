import { Redis } from "@upstash/redis"
import { logger } from "@/lib/logger"

let cached: Redis | null | undefined

export function isRateLimitDisabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED === "1"
}

/**
 * Client Redis REST (serverless / Edge).
 * Retourne null si les variables ne sont pas définies.
 */
export function getRedis(): Redis | null {
  if (cached !== undefined) return cached
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    cached = null
    return null
  }
  cached = new Redis({ url, token })
  return cached
}

export function warnIfRedisMissing(context: string): void {
  if (isRateLimitDisabled()) return
  if (getRedis()) return
  if (process.env.NODE_ENV === "production") {
    logger.warn("ratelimit.redis.missing_env", {
      route: `ratelimit:${context}`,
      action: "warnIfRedisMissing",
      outcome: "disabled",
    })
  }
}
