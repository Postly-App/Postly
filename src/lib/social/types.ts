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
}

export interface PublishContext {
  postId: string
  userId: string
  content: string
  mediaUrls: string[]
}
