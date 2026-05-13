import type { PlatformId } from "@/lib/platforms"

/** Résultat par plateforme après tentative de publication. */
export interface PublishResult {
  /** Valeur issue du post (inchangée pour le client). */
  platform: string
  canonicalPlatform: PlatformId | null
  success: boolean
  /** Identifiant distant (tweet id, post id, etc.) si succès. */
  remoteId?: string
  /** Message d’erreur lisible (français côté orchestrateur). */
  error?: string
  /** Aucun appel réseau effectué (idempotence ou verrou concurrent côté cron). */
  skipped?: boolean
  skipReason?: "already_published" | "concurrent_lock"
  /** Indique si un retry ultérieur (queue) pourrait réussir. */
  retryable?: boolean
  /** Code HTTP brut du provider si applicable. */
  providerStatusCode?: number
  /** Code erreur API (Graph, etc.) si exploitable sans données sensibles. */
  providerErrorCode?: string
}

export interface PublishContext {
  postId: string
  userId: string
  content: string
  mediaUrls: string[]
}
