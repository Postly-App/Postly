"use client"

import { toast } from "sonner"

/**
 * Wrapper fetch côté client qui gère uniformément :
 * - HTTP 402 PLAN_LIMIT_REACHED → toast avec lien vers /billing
 * - HTTP 429 → toast "trop de requêtes"
 * - Autres erreurs → toast avec le message API
 *
 * Retourne { ok: boolean, data?: T, error?: string } sans throw.
 */
export interface ApiFetchResult<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
  code?: string
}

export async function apiFetch<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<ApiFetchResult<T>> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    toast.error("Pas de connexion au serveur.")
    return { ok: false, status: 0, error: "network" }
  }

  // 204 No Content
  if (res.status === 204) {
    return { ok: true, status: 204 }
  }

  let body: Record<string, unknown> = {}
  try {
    body = (await res.json()) as Record<string, unknown>
  } catch {
    /* pas de JSON, on continue */
  }

  if (res.ok) {
    return { ok: true, status: res.status, data: body as T }
  }

  const error = typeof body.error === "string" ? body.error : `HTTP ${res.status}`
  const code = typeof body.code === "string" ? body.code : undefined

  if (res.status === 402 && code === "PLAN_LIMIT_REACHED") {
    toast.error(error, {
      action: {
        label: "Mettre à niveau",
        onClick: () => {
          window.location.href = "/billing"
        },
      },
      duration: 8000,
    })
    return { ok: false, status: 402, error, code }
  }

  if (res.status === 429) {
    toast.error(error || "Trop de requêtes. Réessaye dans quelques secondes.")
    return { ok: false, status: 429, error, code }
  }

  if (res.status === 401) {
    toast.error("Session expirée. Reconnecte-toi.")
    return { ok: false, status: 401, error, code }
  }

  toast.error(error)
  return { ok: false, status: res.status, error, code }
}
