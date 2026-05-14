/**
 * Journalisation structurée backend (Vercel / serverless / Edge-safe).
 * Prêt pour agrégation (Sentry, Axiom, Datadog) : une ligne JSON par événement en prod.
 */
import { captureException, captureMessage } from "@/lib/sentry"

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

const SENSITIVE_KEY_SUBSTRINGS = [
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
  "apikey",
  "api_key",
  "client_secret",
  "stripe-signature",
  "stripe_signature",
  "csrf",
  "session",
  "bearer",
  "id_token",
  "refresh_token",
  "access_token",
  "oauth",
  "private_key",
  "resend",
  "webhook",
] as const

const SENSITIVE_VALUE_PATTERNS = [
  /^sk_(live|test)_[a-z0-9]+$/i,
  /^pk_(live|test)_[a-z0-9]+$/i,
  /^whsec_[a-z0-9]+$/i,
  /^Bearer\s+.+/i,
  /^Basic\s+.+/i,
]

function looksSensitiveString(s: string): boolean {
  const t = s.trim()
  if (t.length > 80 && /^[A-Za-z0-9+/=_-]+$/.test(t)) return true
  return SENSITIVE_VALUE_PATTERNS.some((re) => re.test(t))
}

function redactKey(key: string): boolean {
  const k = key.toLowerCase()
  return SENSITIVE_KEY_SUBSTRINGS.some((s) => k.includes(s))
}

/**
 * Retire / masque les champs sensibles d’un objet avant log (récursif, profondeur bornée).
 */
export function sanitizeLogObject(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 10) return "[MAX_DEPTH]"
  if (value === null || value === undefined) return value
  if (typeof value === "string") {
    if (looksSensitiveString(value)) return "[REDACTED]"
    return value.length > 2000 ? `${value.slice(0, 2000)}…[truncated]` : value
  }
  if (typeof value === "number" || typeof value === "boolean") return value
  if (typeof value === "bigint") return String(value)
  if (value instanceof Error) {
    return toLoggableError(value)
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => sanitizeLogObject(v, depth + 1, seen))
  }
  if (typeof value === "object") {
    if (seen.has(value as object)) return "[Circular]"
    seen.add(value as object)
    const out: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (redactKey(key)) {
        out[key] = "[REDACTED]"
        continue
      }
      out[key] = sanitizeLogObject(v, depth + 1, seen)
    }
    return out
  }
  if (typeof value === "symbol") return String(value)
  return "[UNSERIALIZABLE]"
}

/**
 * Erreur sérialisable pour les logs (pas de fuite de stack en prod).
 */
export function toLoggableError(err: unknown): {
  name: string
  message: string
  code?: string
  stack?: string
} {
  if (!(err instanceof Error)) {
    return { name: "NonError", message: String(err).slice(0, 500) }
  }
  const base = {
    name: err.name,
    message: err.message.slice(0, 2000),
    ...(err && typeof err === "object" && "code" in err
      ? { code: String((err as { code?: unknown }).code) }
      : {}),
  }
  if (!isProduction()) {
    return { ...base, stack: err.stack?.split("\n").slice(0, 12).join("\n") }
  }
  return base
}

export type LogContext = {
  route?: string
  userId?: string
  postId?: string
  provider?: string
  platform?: string
  correlationId?: string
  requestId?: string
  action?: string
  outcome?: string
  status?: number
  [key: string]: unknown
}

function newCorrelationId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }
  } catch {
    /* ignore */
  }
  return `cid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function emit(
  level: "info" | "warn" | "error" | "audit",
  msg: string,
  context?: LogContext
): void {
  const correlationId =
    typeof context?.correlationId === "string" && context.correlationId.length > 0
      ? context.correlationId
      : newCorrelationId()
  const { correlationId: _drop, ...rest } = context ?? {}
  const payload = sanitizeLogObject({
    ts: new Date().toISOString(),
    level,
    service: "postly",
    msg,
    correlationId,
    ...rest,
  }) as Record<string, unknown>

  const line = JSON.stringify(payload)

  if (isProduction()) {
    if (level === "error") console.error(line)
    else if (level === "warn") console.warn(line)
    else console.log(line)
    return
  }

  const prefix = `[${String(payload.ts)}] [${level}] [${correlationId}]`
  if (level === "error") console.error(prefix, msg, payload)
  else if (level === "warn") console.warn(prefix, msg, payload)
  else console.log(prefix, msg, payload)
}

export type LogErrorContext = LogContext & { err?: unknown }

export const logger = {
  info(msg: string, context?: LogContext): void {
    emit("info", msg, context)
  },
  warn(msg: string, context?: LogContext): void {
    emit("warn", msg, context)
  },
  error(msg: string, context?: LogErrorContext): void {
    const { err, ...rest } = context ?? {}
    const merged: LogContext = { ...rest }
    if (err !== undefined) {
      merged.error = toLoggableError(err) as unknown
    }
    emit("error", msg, merged)
    // Forward to Sentry si SENTRY_DSN est défini (no-op sinon)
    if (err !== undefined) {
      captureException(err, {
        level: "error",
        tags: {
          route: typeof rest.route === "string" ? rest.route : "unknown",
        },
        extra: { msg, ...rest },
      })
    } else {
      captureMessage(msg, { level: "error", extra: rest })
    }
  },
  /** Événements traçabilité / sécurité (niveau dédié pour filtres downstream). */
  audit(msg: string, context?: LogContext): void {
    emit("audit", msg, context)
  },
}
