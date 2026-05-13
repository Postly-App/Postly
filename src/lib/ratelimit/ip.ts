import type { NextRequest } from "next/server"

function fromHeaders(h: Headers): string {
  const xff = h.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("true-client-ip") ||
    "unknown"
  )
}

/** IP client (Vercel / CDN). */
export function getClientIp(req: NextRequest | Request): string {
  return fromHeaders(req.headers)
}

export function getClientIpFromHeaders(headers: Headers): string {
  return fromHeaders(headers)
}
