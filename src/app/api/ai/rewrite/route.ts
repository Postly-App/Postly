import { NextResponse } from "next/server"
import OpenAI from "openai"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/ratelimit"
import { sanitizeUserText } from "@/lib/ai/chat"
import { checkCanUseAi } from "@/lib/plan-limits"
import { logger } from "@/lib/logger"

/**
 * Réécriture inline de contenu via IA — utilisé par le Studio.
 *
 * Endpoint dédié (séparé du chat) pour avoir des prompts ultra-courts,
 * cachables côté client, et un format de réponse strict (texte brut, pas
 * de markdown). Permet le pattern "sélectionne action → texte remplacé".
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1"
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"
const OPENAI_DEFAULT_MODEL = "gpt-4o-mini"

export const runtime = "nodejs"
export const maxDuration = 30

type Action =
  | "improve"
  | "shorten"
  | "viral"
  | "professional"
  | "punchy"
  | "hashtags"

const ACTIONS: Record<Action, { system: string; user: (c: string, ctx?: PlatformCtx) => string }> = {
  improve: {
    system:
      "Tu es un rédacteur social media expert. Améliore le post sans changer son intention. Garde le ton, renforce la clarté, l'accroche et la valeur ajoutée. Réponds UNIQUEMENT par le texte réécrit, sans guillemets ni commentaire.",
    user: (c, ctx) =>
      `Plateforme cible : ${ctx?.platforms?.join(", ") || "réseaux sociaux"}.\nLimite : ${ctx?.maxChars ?? 2200} caractères.\n\nPost à améliorer :\n"""\n${c}\n"""`,
  },
  shorten: {
    system:
      "Tu es éditeur social. Raccourcis le post de 30 à 50 % en gardant l'essentiel (hook, message clé, CTA). Réponds UNIQUEMENT par le texte raccourci, sans guillemets ni commentaire.",
    user: (c, ctx) =>
      `Plateforme cible : ${ctx?.platforms?.join(", ") || "réseaux sociaux"}.\nLimite : ${ctx?.maxChars ?? 2200} caractères.\n\nPost original :\n"""\n${c}\n"""`,
  },
  viral: {
    system:
      "Tu es expert en hooks viraux français. Réécris le post avec une accroche très forte sur la 1ère ligne (question provocante, chiffre choc, ou contradiction), des paragraphes courts, et une fin qui engage (question, CTA). Pas de clickbait grossier — reste pro mais accrocheur. Réponds UNIQUEMENT par le texte, sans guillemets.",
    user: (c, ctx) =>
      `Plateforme : ${ctx?.platforms?.join(", ") || "réseaux sociaux"}.\nLimite : ${ctx?.maxChars ?? 2200} caractères.\n\nPost à viraliser :\n"""\n${c}\n"""`,
  },
  professional: {
    system:
      "Tu es rédacteur LinkedIn senior. Réécris le post avec un ton expert et professionnel (vocabulaire précis, phrases construites, pas d'emoji excessif, pas de familiarité). Garde la longueur. Réponds UNIQUEMENT par le texte réécrit.",
    user: (c, ctx) =>
      `Plateforme : ${ctx?.platforms?.join(", ") || "LinkedIn"}.\nLimite : ${ctx?.maxChars ?? 3000} caractères.\n\nPost à formaliser :\n"""\n${c}\n"""`,
  },
  punchy: {
    system:
      "Tu es copywriter direct-response. Ajoute ou renforce un Call-to-Action clair à la fin du post (action précise, urgence, bénéfice immédiat). Garde le corps. Réponds UNIQUEMENT par le texte avec le CTA, sans guillemets.",
    user: (c, ctx) =>
      `Plateforme : ${ctx?.platforms?.join(", ") || "réseaux sociaux"}.\n\nPost à doter d'un CTA fort :\n"""\n${c}\n"""`,
  },
  hashtags: {
    system:
      "Tu suggères des hashtags pertinents en français pour un post social. Réponds UNIQUEMENT par 6 à 10 hashtags séparés par des espaces, sur une seule ligne. Pas de phrase, pas d'explication. Format : #motcle #autre #etc.",
    user: (c, ctx) =>
      `Plateforme : ${ctx?.platforms?.join(", ") || "réseaux sociaux"}.\n\nPost :\n"""\n${c}\n"""\n\nDonne 6 à 10 hashtags FR pertinents, mix de larges + niche.`,
  },
}

interface PlatformCtx {
  platforms?: string[]
  maxChars?: number
}

function getProvider(): { client: OpenAI; model: string } | null {
  const groqKey = process.env.GROQ_API_KEY?.trim()
  if (groqKey) {
    return {
      client: new OpenAI({ apiKey: groqKey, baseURL: GROQ_BASE_URL }),
      model: process.env.GROQ_MODEL?.trim() || GROQ_DEFAULT_MODEL,
    }
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL,
    }
  }
  return null
}

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
    "Trop de requêtes IA. Réessayez dans un instant."
  )
  if (limited) return limited

  const provider = getProvider()
  if (!provider) {
    return NextResponse.json(
      { error: "Provider IA non configuré côté serveur.", code: "AI_NOT_CONFIGURED" },
      { status: 503 }
    )
  }

  let body: { action?: Action; content?: string; platforms?: string[]; maxChars?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 })
  }

  const action = body.action
  if (!action || !(action in ACTIONS)) {
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 })
  }

  const content = sanitizeUserText(body.content ?? "")
  if (!content || content.length < 3) {
    return NextResponse.json(
      { error: "Écris au moins quelques mots avant de demander à l'IA." },
      { status: 400 }
    )
  }

  const ctx: PlatformCtx = {
    platforms: Array.isArray(body.platforms)
      ? body.platforms.filter((p): p is string => typeof p === "string").slice(0, 7)
      : undefined,
    maxChars: typeof body.maxChars === "number" && body.maxChars > 0 ? body.maxChars : undefined,
  }

  const spec = ACTIONS[action]
  try {
    const completion = await provider.client.chat.completions.create({
      model: provider.model,
      temperature: action === "hashtags" ? 0.7 : 0.55,
      max_tokens: action === "hashtags" ? 120 : 1_400,
      messages: [
        { role: "system", content: spec.system },
        { role: "user", content: spec.user(content, ctx) },
      ],
    })
    const out = completion.choices[0]?.message?.content?.trim()
    if (!out) {
      return NextResponse.json(
        { error: "Réponse vide du modèle." },
        { status: 502 }
      )
    }
    // Le modèle peut encadrer en guillemets — on les enlève proprement.
    const cleaned = out
      .replace(/^["'«»]+/g, "")
      .replace(/["'«»]+$/g, "")
      .trim()
    return NextResponse.json({ text: cleaned, action })
  } catch (err) {
    logger.error("api.ai.rewrite.failed", {
      route: "/api/ai/rewrite",
      userId,
      action,
      err,
    })
    return NextResponse.json(
      { error: "L'IA n'a pas pu répondre. Réessaie." },
      { status: 502 }
    )
  }
}
