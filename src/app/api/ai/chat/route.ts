import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import {
  isAiChatConfigured,
  sanitizeClientMessages,
  sendChatMessage,
} from "@/lib/ai/chat"
import { checkCanUseAi } from "@/lib/plan-limits"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  const userId = session.user.id

  const aiCheck = await checkCanUseAi(userId)
  if (!aiCheck.allowed) {
    return NextResponse.json(
      {
        error: aiCheck.reason,
        code: "PLAN_LIMIT_REACHED",
        plan: aiCheck.plan,
      },
      { status: 402 }
    )
  }

  const limited = await enforceRateLimit(
    "aiChatUser",
    `user:${userId}`,
    "Trop de messages à l’assistant. Réessayez plus tard."
  )
  if (limited) return limited

  if (!isAiChatConfigured()) {
    return NextResponse.json(
      {
        error:
          "L'assistant IA n'est pas configuré (GROQ_API_KEY ou OPENAI_API_KEY manquante côté serveur).",
        code: "AI_NOT_CONFIGURED",
      },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 })
  }

  const stream = Boolean((body as { stream?: unknown }).stream)
  const messages = sanitizeClientMessages((body as { messages?: unknown }).messages)

  if (messages.length === 0) {
    return NextResponse.json({ error: "Envoie au moins un message utilisateur." }, { status: 400 })
  }

  const last = messages[messages.length - 1]
  if (last.role !== "user") {
    return NextResponse.json(
      { error: "Le dernier message de la conversation doit être un message utilisateur." },
      { status: 400 }
    )
  }

  try {
    if (stream) {
      const out = await sendChatMessage({
        userId,
        messages,
        stream: true,
        signal: req.signal,
      })
      return new Response(out as ReadableStream<Uint8Array>, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      })
    }

    const reply = await sendChatMessage({
      userId,
      messages,
      stream: false,
      signal: req.signal,
    })
    return NextResponse.json({ reply })
  } catch (err) {
    logger.error("api.ai.chat_failed", {
      route: "/api/ai/chat",
      userId,
      err,
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur assistant IA." },
      { status: 500 }
    )
  }
}
