import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const TOKEN_ENDPOINTS: Record<string, string> = {
  twitter: "https://api.twitter.com/2/oauth2/token",
  linkedin: "https://www.linkedin.com/oauth/v2/accessToken",
  facebook: "https://graph.facebook.com/v18.0/oauth/access_token",
  instagram: "https://api.instagram.com/oauth/access_token",
};

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
const session = await getServerSession(authOptions);  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", req.url));

  const { provider } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) return NextResponse.redirect(new URL(`/dashboard/accounts?error=${error}`, req.url));
  if (!code) return NextResponse.redirect(new URL("/dashboard/accounts?error=missing_code", req.url));

  const endpoint = TOKEN_ENDPOINTS[provider];
  if (!endpoint) return NextResponse.redirect(new URL("/dashboard/accounts?error=unsupported", req.url));

  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/${provider}`;

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId!,
      client_secret: clientSecret!,
    });

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
    const tokens = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    await prisma.socialAccount.upsert({
      where: { userId_provider: { userId: session.user.id, provider } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      },
      create: {
        userId: session.user.id,
        provider,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      },
    });

    return NextResponse.redirect(new URL("/dashboard/accounts?connected=" + provider, req.url));
  } catch (e) {
    console.error("OAuth callback error", e);
    return NextResponse.redirect(new URL("/dashboard/accounts?error=token_exchange", req.url));
  }
}
