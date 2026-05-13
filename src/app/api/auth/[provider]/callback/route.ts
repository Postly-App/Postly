import { NextResponse } from "next/server"
import { handleSocialOauthCallback } from "@/lib/social/oauth/social-oauth-callback"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider } = await ctx.params
  return handleSocialOauthCallback(provider, req)
}
