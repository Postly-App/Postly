import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createBillingPortalSession } from "@/lib/stripe"
import { logger } from "@/lib/logger"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const returnUrl = process.env.NEXTAUTH_URL + "/billing"
    const url = await createBillingPortalSession(session.user.id, returnUrl)
    return NextResponse.json({ url })
  } catch (error) {
    logger.error("api.billing.portal_failed", {
      route: "/api/billing/portal",
      action: "POST",
      userId: session.user.id,
      err: error,
    })
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 })
  }
}
