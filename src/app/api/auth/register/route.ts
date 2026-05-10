import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire au moins 8 caractères." },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 409 }
      )
    }

    const hash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password: hash },
    })

    // Création subscription FREE automatique (14 jours trial)
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const freeId = crypto.randomUUID()

    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "TRIALING",
        currentPeriodStart: now,
        currentPeriodEnd: thirtyDays,
        trialEnd: trialEnd,
        stripeSubscriptionId: `free_${freeId}`,
        stripeCustomerId: `free_${freeId}`,
        stripePriceId: "free",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[REGISTER]", error)
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez." },
      { status: 500 }
    )
  }
}
