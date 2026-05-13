import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { runOAuthConnect, oauthCallbackBaseUrl } from "@/lib/social/oauth/run-oauth-connect"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", oauthCallbackBaseUrl()))
  }
  const { provider } = await ctx.params
  try {
    return await runOAuthConnect(provider, session.user.id)
  } catch {
    return NextResponse.redirect(
      new URL("/settings?social_error=oauth_connect_failed", oauthCallbackBaseUrl())
    )
  }
}
