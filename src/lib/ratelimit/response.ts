import { NextResponse } from "next/server"

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
  return {
    "Retry-After": String(retryAfter),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  }
}

export function jsonRateLimited(
  result: RateLimitResult,
  body: Record<string, unknown>
): NextResponse {
  return NextResponse.json(body, {
    status: 429,
    headers: rateLimitHeaders(result),
  })
}
