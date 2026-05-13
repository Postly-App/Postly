import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const STATE_TTL_MS = 10 * 60 * 1000

export type OAuthStatePayload = {
  userId: string
  provider: string
  exp: number
  nonce: string
}

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET?.trim()
  if (!s) throw new Error("NEXTAUTH_SECRET manquant pour signer l’état OAuth.")
  return s
}

export function signOAuthState(payload: OAuthStatePayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8")
  const sig = createHmac("sha256", secret()).update(body).digest("base64url")
  return `${body.toString("base64url")}.${sig}`
}

export function verifyOAuthState(token: string): OAuthStatePayload | null {
  try {
    const [b64, sig] = token.split(".")
    if (!b64 || !sig) return null
    const body = Buffer.from(b64, "base64url")
    const expected = createHmac("sha256", secret()).update(body).digest("base64url")
    const a = Buffer.from(sig, "utf8")
    const b = Buffer.from(expected, "utf8")
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const payload = JSON.parse(body.toString("utf8")) as OAuthStatePayload
    if (typeof payload.userId !== "string" || typeof payload.provider !== "string") return null
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function newOAuthNonce(): string {
  return randomBytes(16).toString("base64url")
}
