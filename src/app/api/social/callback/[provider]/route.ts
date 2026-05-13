import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlatformId, type PlatformId } from "@/lib/platforms";
import { resolveOAuthSocialAccount } from "@/lib/social/oauth-account";
import { parseOAuthTokenResponse } from "@/lib/social/oauth-token-parse";
import {
  encryptSocialTokensForPersistence,
  SocialTokenEncryptionConfigurationError,
  logSocialTokenCryptoFailure,
} from "@/lib/social/social-token-crypto";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const TOKEN_ENDPOINTS: Partial<Record<PlatformId, string>> = {
  TWITTER: "https://api.twitter.com/2/oauth2/token",
  LINKEDIN: "https://www.linkedin.com/oauth/v2/accessToken",
  FACEBOOK: "https://graph.facebook.com/v18.0/oauth/access_token",
  INSTAGRAM: "https://api.instagram.com/oauth/access_token",
};

function tokenEndpointForPlatform(platform: PlatformId): string | null {
  return TOKEN_ENDPOINTS[platform] ?? null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { provider } = await params;
  const slugRaw = provider.trim().toLowerCase();
  const canonical = normalizePlatformId(slugRaw);
  if (!canonical) {
    return NextResponse.redirect(
      new URL("/settings?social_error=unsupported_platform", req.url)
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?social_error=${encodeURIComponent(error)}`, req.url)
    );
  }
  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?social_error=missing_code", req.url)
    );
  }

  const endpoint = tokenEndpointForPlatform(canonical);
  if (!endpoint) {
    return NextResponse.redirect(
      new URL("/settings?social_error=unsupported", req.url)
    );
  }

  const clientId = process.env[`${canonical}_CLIENT_ID`];
  const clientSecret = process.env[`${canonical}_CLIENT_SECRET`];
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/${slugRaw}`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/settings?social_error=missing_oauth_config", req.url)
    );
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const rawText = await res.text();
    if (!res.ok) {
      throw new Error(
        `OAuth token exchange failed (HTTP ${res.status}). Response body is not logged to avoid leaking secrets.`
      );
    }

    const tokens = parseOAuthTokenResponse(rawText, res.headers.get("content-type"));

    const { accountId, accountName } = await resolveOAuthSocialAccount(
      canonical,
      tokens.access_token,
      tokens.raw
    );

    const expiresAt =
      tokens.expires_in != null
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

    let encrypted: { accessToken: string; refreshToken?: string | null };
    try {
      encrypted = encryptSocialTokensForPersistence({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
      });
    } catch (e) {
      if (e instanceof SocialTokenEncryptionConfigurationError) {
        logSocialTokenCryptoFailure("oauth-callback", e);
        return NextResponse.redirect(
          new URL("/settings?social_error=social_token_crypto", req.url)
        );
      }
      throw e;
    }

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_accountId: {
          userId: session.user.id,
          platform: canonical,
          accountId,
        },
      },
      update: {
        accountName,
        accessToken: encrypted.accessToken,
        refreshToken: encrypted.refreshToken ?? null,
        expiresAt,
        platform: canonical,
      },
      create: {
        userId: session.user.id,
        platform: canonical,
        accountId,
        accountName,
        accessToken: encrypted.accessToken,
        refreshToken: encrypted.refreshToken ?? null,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL(
        `/settings?social_connected=${encodeURIComponent(canonical)}`,
        req.url
      )
    );
  } catch (e) {
    logger.error("api.social.oauth_callback_failed", {
      route: "/api/social/callback/[provider]",
      action: "GET",
      userId: session.user.id,
      platform: canonical,
      err: e,
    });
    return NextResponse.redirect(
      new URL("/settings?social_error=token_exchange", req.url)
    );
  }
}
