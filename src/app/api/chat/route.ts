import { NextResponse } from "next/server"
import OpenAI from "openai"
import { enforceRateLimit, getClientIp } from "@/lib/ratelimit"
import { sanitizeUserText } from "@/lib/ai/chat"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const maxDuration = 30

const GROQ_BASE_URL = "https://api.groq.com/openai/v1"
const DEFAULT_MODEL = "llama-3.3-70b-versatile"
const FALLBACK_REPLY =
  "Désolé, le service IA est momentanément indisponible. Tu peux écrire à support@getpostly.space en attendant."

const SYSTEM = `Tu es l'assistant virtuel de Postly, un SaaS de gestion et publication de contenu sur les réseaux sociaux. Tu réponds aux questions des visiteurs sur les fonctionnalités, les tarifs et l'utilisation de Postly. Tu es professionnel, concis et bienveillant. Tu ne réponds pas aux questions hors sujet. Si tu ne sais pas, tu invites l'utilisateur à contacter le support : support@getpostly.space`

export async function POST(req: Request) {
  const ip = getClientIp(req) ?? "unknown"
  const limited = await enforceRateLimit(
    "visitorChatIp",
    `ip:${ip}`,
    "Trop de requêtes. Réessayez plus tard."
  )
  if (limited) return limited

  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) {
    return NextResponse.json(
      { error: "Le chat n'est pas disponible pour le moment." },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  }

  const rawMsg = (body as { message?: unknown }).message
  const message = sanitizeUserText(typeof rawMsg === "string" ? rawMsg : "")
  if (!message) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 })
  }

  const client = new OpenAI({ apiKey: key, baseURL: GROQ_BASE_URL })
  const model = process.env.GROQ_VISITOR_MODEL?.trim() || DEFAULT_MODEL

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: message },
      ],
    })
    const reply = completion.choices[0]?.message?.content?.trim()
    if (!reply) {
      return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 200 })
    }
    return NextResponse.json({ reply })
  } catch (e) {
    logger.error("api.chat.visitor_failed", { route: "/api/chat", err: e })
    return NextResponse.json({ reply: FALLBACK_REPLY }, { status: 200 })
  }
}
