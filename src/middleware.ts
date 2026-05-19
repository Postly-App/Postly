import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getNextAuthSecret } from "@/lib/env/auth";
import { rateLimitCredentialsLogin } from "@/lib/ratelimit/credentials-login";

const PUBLIC_PATHS = ["/", "/login", "/register", "/signup", "/forgot-password", "/reset-password", "/pricing", "/about", "/terms", "/privacy", "/compare", "/contact", "/delete-data"];
const PUBLIC_PREFIXES = ["/api/auth", "/api/webhooks", "/api/cron", "/api/chat", "/api/contact", "/api/invitations", "/api/v1", "/api/health", "/invitations", "/_next", "/favicon", "/images", "/fonts"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/api/auth/callback/credentials" && req.method === "POST") {
    const limited = await rateLimitCredentialsLogin(req);
    if (limited) return limited;
  }

  if (isPublic(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: getNextAuthSecret() });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
