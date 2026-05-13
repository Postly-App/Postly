import { Ratelimit, type Duration } from "@upstash/ratelimit"
import type { Redis } from "@upstash/redis"
import { RATE_LIMITS } from "./limits"

function sliding(redis: Redis, prefix: string, max: number, window: Duration) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window),
    prefix: `postly:rl:${prefix}`,
    analytics: true,
  })
}

export type AppLimiters = {
  loginIp: Ratelimit
  loginEmail: Ratelimit
  registerIp: Ratelimit
  forgotIp: Ratelimit
  forgotEmail: Ratelimit
  publishUser: Ratelimit
  aiChatUser: Ratelimit
  stripeIp: Ratelimit
}

export function createLimiters(redis: Redis): AppLimiters {
  const L = RATE_LIMITS
  return {
    loginIp: sliding(redis, "login-ip", L.loginIp.max, L.loginIp.window),
    loginEmail: sliding(redis, "login-email", L.loginEmail.max, L.loginEmail.window),
    registerIp: sliding(redis, "register-ip", L.registerIp.max, L.registerIp.window),
    forgotIp: sliding(redis, "forgot-ip", L.forgotIp.max, L.forgotIp.window),
    forgotEmail: sliding(redis, "forgot-email", L.forgotEmail.max, L.forgotEmail.window),
    publishUser: sliding(redis, "publish-user", L.publishUser.max, L.publishUser.window),
    aiChatUser: sliding(redis, "ai-chat-user", L.aiChatUser.max, L.aiChatUser.window),
    stripeIp: sliding(redis, "stripe-ip", L.stripeIp.max, L.stripeIp.window),
  }
}
