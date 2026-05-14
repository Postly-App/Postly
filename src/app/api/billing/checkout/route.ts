import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getStripe, priceIdToPlan } from "@/lib/stripe"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { priceId } = await req.json()

  if (!priceId) {
    return NextResponse.json({ error: "priceId requis." }, { status: 400 })
  }

  const plan = priceIdToPlan(priceId)
  const subscriptionData: {
    metadata: { userId: string }
    trial_period_days?: number
  } = {
    metadata: { userId: session.user.id },
  }
  if (plan === "PRO") {
    subscriptionData.trial_period_days = 7
  }

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/billing/success?plan=${plan.toLowerCase()}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
    metadata: { userId: session.user.id },
    subscription_data: subscriptionData,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
