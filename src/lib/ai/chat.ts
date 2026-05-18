import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { prisma } from "@/lib/prisma"
import {
  loadUserAnalyticsInsights,
  formatHour,
  WEEKDAYS_FR_LONG,
} from "@/lib/analytics-insights"

const MAX_MESSAGE_CHARS = 4_000
const MAX_CONVERSATION_MESSAGES = 22
const POST_SNIPPET_CHARS = 320

// Groq via OpenAI-compatible endpoint. Falls back to OPENAI_API_KEY if Groq absent.
const GROQ_BASE_URL = "https://api.groq.com/openai/v1"
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"
const OPENAI_DEFAULT_MODEL = "gpt-4o-mini"

/** Caractères de contrôle dangereux / bruit (hors tab / newline). */
const CTRL_EXCEPT_TAB_LF = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

export type ClientChatRole = "user" | "assistant"

export interface ClientChatMessage {
  role: ClientChatRole
  content: string
}

export interface SendChatMessageParams {
  userId: string
  messages: ClientChatMessage[]
  stream: boolean
  signal?: AbortSignal
}

export interface AiUserContextSnapshot {
  displayName: string | null
  plan: string
  subscriptionStatus: string | null
  totalPosts: number
  connectedPlatforms: string[]
  /** Bloc texte unique injecté dans le prompt (résumé métier). */
  serverContextSummary: string
}

/**
 * IA configurée si on a au moins une clé (Groq prioritaire, OpenAI fallback).
 */
export function isAiChatConfigured(): boolean {
  return Boolean(
    process.env.GROQ_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()
  )
}

interface AiProviderConfig {
  apiKey: string
  baseURL?: string
  model: string
  provider: "groq" | "openai"
}

function getAiProvider(): AiProviderConfig | null {
  const groqKey = process.env.GROQ_API_KEY?.trim()
  if (groqKey) {
    return {
      apiKey: groqKey,
      baseURL: GROQ_BASE_URL,
      model: process.env.GROQ_MODEL?.trim() || GROQ_DEFAULT_MODEL,
      provider: "groq",
    }
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    return {
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL,
      provider: "openai",
    }
  }
  return null
}

/**
 * Nettoie une entrée utilisateur : pas de secrets injectés côté client,
 * suppression de caractères de contrôle, longueur bornée.
 */
export function sanitizeUserText(raw: string): string {
  if (typeof raw !== "string") return ""
  const stripped = raw.replace(CTRL_EXCEPT_TAB_LF, "").trim()
  return stripped.slice(0, MAX_MESSAGE_CHARS)
}

/**
 * Valide et tronque l'historique client (user / assistant uniquement).
 */
export function sanitizeClientMessages(input: unknown): ClientChatMessage[] {
  if (!Array.isArray(input)) return []
  const out: ClientChatMessage[] = []
  for (const item of input) {
    if (out.length >= MAX_CONVERSATION_MESSAGES) break
    if (!item || typeof item !== "object") continue
    const role = (item as { role?: unknown }).role
    const content = (item as { content?: unknown }).content
    if (role !== "user" && role !== "assistant") continue
    if (typeof content !== "string") continue
    const clean = sanitizeUserText(content)
    if (!clean) continue
    out.push({ role, content: clean })
  }
  return out
}

function truncateSnippet(text: string, max = POST_SNIPPET_CHARS): string {
  const t = text.replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

/**
 * Contexte métier Postly pour le prompt système.
 * Inclut désormais les insights analytics : meilleurs créneaux, plateformes top,
 * ton/sujets récents — pour permettre à l'IA d'adapter ses réponses.
 */
export async function loadAiUserContext(
  userId: string
): Promise<AiUserContextSnapshot> {
  const [user, totalPosts, subscription, socialAccounts, recentPosts, insights] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
      prisma.post.count({ where: { userId } }),
      prisma.subscription.findUnique({
        where: { userId },
        select: { plan: true, status: true },
      }),
      prisma.socialAccount.findMany({
        where: { userId },
        select: { platform: true, accountName: true },
        orderBy: { updatedAt: "desc" },
        take: 12,
      }),
      prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          status: true,
          platforms: true,
          content: true,
          createdAt: true,
          scheduledAt: true,
        },
      }),
      loadUserAnalyticsInsights(userId, 30),
    ])

  const email = user?.email ?? ""
  const emailHint = email.includes("@")
    ? `${email.split("@")[0]?.slice(0, 2) ?? ""}••@${email.split("@")[1] ?? ""}`
    : "inconnu"

  const platforms = [...new Set(socialAccounts.map((a) => a.platform))]

  const recentPostsLines = recentPosts.length
    ? recentPosts
        .map((p, i) => {
          const plats = (p.platforms ?? []).join(", ") || "—"
          return `${i + 1}. [${p.status}] (${plats}) ${truncateSnippet(p.content)}`
        })
        .join("\n")
    : "Aucun post enregistré pour l'instant."

  const accountsLines = socialAccounts.length
    ? socialAccounts
        .map((a) => `- ${a.platform}: ${truncateSnippet(a.accountName, 80)}`)
        .join("\n")
    : "Aucun compte social connecté."

  const bestSlotsLine =
    insights.bestSlots.length > 0
      ? insights.bestSlots
          .map(
            (s) =>
              `${WEEKDAYS_FR_LONG[s.weekday]} ${formatHour(s.hour)} (reach cumulé ${s.reach.toLocaleString("fr-FR")})`
          )
          .join(" · ")
      : "Pas encore assez de données analytics pour identifier des créneaux. Conseil par défaut : tester mardi-jeudi entre 11h et 13h, et 18h-20h."

  const topPlatformsLine =
    insights.topPlatforms.length > 0
      ? insights.topPlatforms
          .map((p) => `${p.platform}=${p.reach.toLocaleString("fr-FR")}`)
          .join(" · ")
      : "Pas encore de signaux analytics."

  const serverContextSummary = [
    `Email masqué : ${emailHint}`,
    `Plan : ${subscription?.plan ?? "FREE"}${subscription?.status ? ` (statut abonnement : ${subscription.status})` : ""}`,
    `Nombre total de posts : ${totalPosts}`,
    `Réseaux connectés (plateformes distinctes) : ${platforms.length ? platforms.join(", ") : "aucun"}`,
    `Comptes (nom affiché uniquement) :\n${accountsLines}`,
    `Derniers posts (extraits — pour analyser ton, sujets, fréquence) :\n${recentPostsLines}`,
    `Top plateformes par reach 30j : ${topPlatformsLine}`,
    `Meilleurs créneaux observés (30j) : ${bestSlotsLine}`,
  ].join("\n")

  return {
    displayName: user?.name ?? null,
    plan: subscription?.plan ?? "FREE",
    subscriptionStatus: subscription?.status ?? null,
    totalPosts,
    connectedPlatforms: platforms,
    serverContextSummary,
  }
}

function buildSystemPrompt(ctx: AiUserContextSnapshot): string {
  const who = ctx.displayName
    ? `L'utilisateur s'appelle « ${ctx.displayName} ».`
    : "L'utilisateur n'a pas renseigné de nom affiché."

  return [
    "Tu es l'assistant IA de Postly — un copilote stratégique pour créateurs et marques sur les réseaux sociaux.",
    "Tu réponds en français, ton chaleureux mais expert, concis (max 5-6 phrases par défaut sauf demande explicite de plus).",
    "",
    "🎯 Ton rôle :",
    "- Adapter chaque réponse au contexte de CE user (ton, plateformes, créneaux performants, sujets récents).",
    "- Proposer des idées de posts concrètes (avec hooks, CTAs, hashtags) calibrées sur les plateformes que l'utilisateur utilise vraiment.",
    "- Recommander les meilleurs créneaux de publication à partir des données analytics observées (voir contexte). Si pas de données, donner des règles génériques mais signaler que c'est générique.",
    "- Analyser le ton/style des derniers posts pour rester cohérent.",
    "- Suggérer des améliorations rédactionnelles (clarté, accroche, longueur, hashtags).",
    "",
    "🚫 Garde-fous :",
    "- Pas d'accès aux comptes réels / APIs sociales : ne promets jamais de publier toi-même, oriente vers le bouton 'Programmer' de Postly.",
    "- Ne demande JAMAIS de mots de passe, jetons API, clés Stripe. Refuse poliment si l'utilisateur en colle.",
    "- Si tu manques d'info, pose UNE question courte (pas plus).",
    "- Pas de blabla générique type 'voici quelques conseils...' — vise direct.",
    "",
    "--- Contexte utilisateur (injecté serveur, à exploiter dans chaque réponse) ---",
    who,
    ctx.serverContextSummary,
    "",
    "Fin du contexte.",
  ].join("\n")
}

async function buildOpenAIMessages(
  userId: string,
  clientMessages: ClientChatMessage[]
): Promise<ChatCompletionMessageParam[]> {
  const ctx = await loadAiUserContext(userId)
  const system: ChatCompletionMessageParam = {
    role: "system",
    content: buildSystemPrompt(ctx),
  }
  const rest: ChatCompletionMessageParam[] = clientMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }))
  return [system, ...rest]
}

/**
 * Envoie la conversation au provider IA (Groq prioritaire, OpenAI fallback).
 * Retourne soit le texte complet, soit un flux UTF-8 brut (deltas concaténés).
 */
export async function sendChatMessage(
  params: SendChatMessageParams
): Promise<string | ReadableStream<Uint8Array>> {
  const cfg = getAiProvider()
  if (!cfg) {
    throw new Error(
      "Aucune clé IA configurée (GROQ_API_KEY ou OPENAI_API_KEY)."
    )
  }

  const client = new OpenAI({
    apiKey: cfg.apiKey,
    ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}),
  })

  const messages = await buildOpenAIMessages(params.userId, params.messages)

  if (params.stream) {
    const stream = await client.chat.completions.create(
      {
        model: cfg.model,
        messages,
        stream: true,
        temperature: 0.6,
        max_tokens: 2_048,
      },
      { signal: params.signal }
    )

    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of stream) {
            const piece = chunk.choices[0]?.delta?.content
            if (piece) controller.enqueue(encoder.encode(piece))
          }
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
    })
  }

  const completion = await client.chat.completions.create(
    {
      model: cfg.model,
      messages,
      stream: false,
      temperature: 0.6,
      max_tokens: 2_048,
    },
    { signal: params.signal }
  )

  const text = completion.choices[0]?.message?.content?.trim()
  if (!text) throw new Error("Réponse vide du modèle.")
  return text
}
