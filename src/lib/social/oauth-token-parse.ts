/** Parse la réponse d’échange de token (JSON ou x-www-form-urlencoded). */
export function parseOAuthTokenResponse(
  rawBody: string,
  contentType: string | null
): {
  access_token: string
  refresh_token?: string
  expires_in?: number
  raw: Record<string, unknown>
} {
  const trimmed = rawBody.trim()
  const isJson =
    trimmed.startsWith("{") ||
    (contentType?.includes("application/json") ?? false)

  if (isJson) {
    const j = JSON.parse(trimmed) as Record<string, unknown>
    const at = j.access_token
    if (typeof at !== "string") throw new Error("Réponse token: access_token manquant")
    return {
      access_token: at,
      refresh_token: typeof j.refresh_token === "string" ? j.refresh_token : undefined,
      expires_in: typeof j.expires_in === "number" ? j.expires_in : undefined,
      raw: j,
    }
  }

  const params = new URLSearchParams(trimmed)
  const at = params.get("access_token")
  if (!at) throw new Error("Réponse token: access_token manquant (form-urlencoded)")
  const exp = params.get("expires_in")
  return {
    access_token: at,
    refresh_token: params.get("refresh_token") ?? undefined,
    expires_in: exp ? Number(exp) : undefined,
    raw: Object.fromEntries(params.entries()),
  }
}
