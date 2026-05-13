import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createLimiters } from "./limiters"
import { getClientIp } from "./ip"
import { getRedis, isRateLimitDisabled, warnIfRedisMissing } from "./redis"
import { jsonRateLimited } from "./response"

/**
 * Rate limit pour POST /api/auth/callback/credentials (NextAuth + json:true).
 * Le client next-auth/react exige un champ `url` dans le JSON pour redirect:false.
 */
export async function rateLimitCredentialsLogin(
  req: NextRequest
): Promise<NextResponse | null> {
  if (isRateLimitDisabled()) return null

  const redis = getRedis()
  if (!redis) {
    warnIfRedisMissing("credentials-login")
    return null
  }

  const { loginIp, loginEmail } = createLimiters(redis)
  const ip = getClientIp(req)

  let email = ""
  try {
    const raw = await req.clone().text()
    const params = new URLSearchParams(raw)
    email = (params.get("email") || "").trim().toLowerCase()
  } catch {
    /* body illisible — on applique au moins la limite IP */
  }

  const ipResult = await loginIp.limit(`ip:${ip}`)
  if (!ipResult.success) {
    const origin = req.nextUrl.origin
    return jsonRateLimited(ipResult, {
      error: "Trop de tentatives de connexion. Réessayez plus tard.",
      code: "RATE_LIMITED",
      url: `${origin}/login?error=RateLimited`,
    })
  }

  if (email) {
    const emailResult = await loginEmail.limit(`email:${email}`)
    if (!emailResult.success) {
      const origin = req.nextUrl.origin
      return jsonRateLimited(emailResult, {
        error: "Trop de tentatives pour ce compte. Réessayez plus tard.",
        code: "RATE_LIMITED",
        url: `${origin}/login?error=RateLimited`,
      })
    }
  }

  return null
}
