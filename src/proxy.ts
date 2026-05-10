import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/compose/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/api/posts/:path*",
    "/api/analytics/:path*",
    "/api/billing/:path*",
    "/api/social/:path*",
  ],
}
