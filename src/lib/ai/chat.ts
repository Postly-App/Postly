import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { prisma } from "@/lib/prisma"

const MAX_MESSAGE_CHARS = 4_000
const MAX_CONVERSATION_MESSAGES = 22
const POST_SNIPPET_CHARS = 320
const MODEL_DEFAULT = "gpt-4o-mini"

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

export function isAiChatConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || MODEL_DEFAULT
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
 * Valide et tronque l’historique client (user / assistant uniquement).
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
 * Contexte métier Postly pour le prompt système (aucun jeton, id Stripe, email complet).
 */
export async function loadAiUserContext(userId: string): Promise<AiUserContextSnapshot> {
  const [user, totalPosts, subscription, socialAccounts, recentPosts] = await Promise.all([
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
  ])

  const email = user?.email ?? ""
  const emailHint = email.includes("@") ? `${email.split("@")[0]?.slice(0, 2) ?? ""}••@${email.split("@")[1] ?? ""}` : "inconnu"

  const platforms = [...new Set(socialAccounts.map((a) => a.platform))]

  const recentPostsLines = recentPosts.length
    ? recentPosts
        .map((p, i) => {
          const plats = (p.platforms ?? []).join(", ") || "—"
          return `${i + 1}. [${p.status}] (${plats}) ${truncateSnippet(p.content)}`
        })
        .join("\n")
    : "Aucun post enregistré pour l’instant."

  const accountsLines = socialAccounts.length
    ? socialAccounts
        .map((a) => `- ${a.platform}: ${truncateSnippet(a.accountName, 80)}`)
        .join("\n")
    : "Aucun compte social connecté."

  const serverContextSummary = [
    `Email masqué : ${emailHint}`,
    `Plan : ${subscription?.plan ?? "FREE"}${subscription?.status ? ` (statut abonnement : ${subscription.status})` : ""}`,
    `Nombre total de posts : ${totalPosts}`,
    `Réseaux connectés (plateformes distinctes) : ${platforms.length ? platforms.join(", ") : "aucun"}`,
    `Comptes (nom affiché uniquement) :\n${accountsLines}`,
    `Derniers posts (extraits) :\n${recentPostsLines}`,
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
  const who = ctx.displayName ? `L’utilisateur s’appelle « ${ctx.displayName} ».` : "L’utilisateur n’a pas renseigné de nom affiché."
  return [
    "Tu es l’assistant Postly, une application de planification et publication sur les réseaux sociaux.",
    "Tu réponds en français, de façon concise et actionnable.",
    "Tu aides à : analyser les posts décrits dans le contexte, proposer des idées, rédiger ou améliorer des contenus, expliquer les bonnes pratiques.",
    "Tu n’as pas accès aux comptes réels ni aux API sociales : ne promets jamais de publier ou modifier quoi que ce soit toi-même ; oriente vers l’interface Postly.",
    "Ne demande jamais de mots de passe, jetons API, clés Stripe ou secrets. Ne répète pas d’identifiants sensibles si l’utilisateur en colle dans le chat — refuse poliment.",
    "Si le contexte ne suffit pas, pose une question courte.",
    "",
    "--- Contexte Postly (résumé injecté par le serveur) ---",
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
 * Envoie la conversation à OpenAI. Retourne soit le texte complet, soit un flux UTF-8 brut (deltas concaténés).
 */
export async function sendChatMessage(
  params: SendChatMessageParams
): Promise<string | ReadableStream<Uint8Array>> {
  const openai = getOpenAIClient()
  if (!openai) {
    throw new Error("OPENAI_API_KEY manquant : l’assistant IA n’est pas configuré sur ce serveur.")
  }

  const messages = await buildOpenAIMessages(params.userId, params.messages)
  const model = getOpenAIModel()

  if (params.stream) {
    const stream = await openai.chat.completions.create(
      {
        model,
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

  const completion = await openai.chat.completions.create(
    {
      model,
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
