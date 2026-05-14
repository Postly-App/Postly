/**
 * Sentry minimaliste sans dépendance npm.
 * Si SENTRY_DSN est défini, poste les erreurs au endpoint Envelope.
 * Sinon, no-op. Ne bloque jamais le flow appelant.
 *
 * Doc Sentry SDK Development (Envelope) : https://develop.sentry.dev/sdk/envelopes/
 */

interface ParsedDsn {
  authToken: string
  envelopeUrl: string
  projectId: string
}

let cachedDsn: ParsedDsn | null | undefined = undefined

function parseDsn(): ParsedDsn | null {
  if (cachedDsn !== undefined) return cachedDsn

  const raw = process.env.SENTRY_DSN?.trim()
  if (!raw) {
    cachedDsn = null
    return null
  }
  try {
    const url = new URL(raw)
    const publicKey = url.username
    if (!publicKey) {
      cachedDsn = null
      return null
    }
    const projectId = url.pathname.replace(/^\//, "").replace(/\/$/, "")
    if (!projectId) {
      cachedDsn = null
      return null
    }
    const host = url.host
    const envelopeUrl = `${url.protocol}//${host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`
    cachedDsn = { authToken: publicKey, envelopeUrl, projectId }
    return cachedDsn
  } catch {
    cachedDsn = null
    return null
  }
}

function genEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "")
  }
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
}

interface CaptureContext {
  message: string
  level?: "error" | "warning" | "info"
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  fingerprint?: string[]
}

/**
 * Envoie un événement Sentry. Best-effort, jamais bloquant.
 */
export function captureException(error: unknown, context?: Omit<CaptureContext, "message">): void {
  const dsn = parseDsn()
  if (!dsn) return

  const errObj = error instanceof Error ? error : new Error(String(error))
  const eventId = genEventId()
  const now = new Date().toISOString()

  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: context?.level ?? "error",
    server_name: process.env.VERCEL_REGION ?? "unknown",
    environment: process.env.NODE_ENV ?? "production",
    release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    exception: {
      values: [
        {
          type: errObj.name,
          value: errObj.message.slice(0, 1000),
          stacktrace: errObj.stack
            ? {
                frames: parseStackFrames(errObj.stack),
              }
            : undefined,
        },
      ],
    },
    tags: context?.tags ?? {},
    extra: context?.extra ?? {},
    fingerprint: context?.fingerprint,
  }

  const header = { event_id: eventId, sent_at: now, dsn: process.env.SENTRY_DSN }
  const itemHeader = { type: "event", content_type: "application/json" }

  const body = `${JSON.stringify(header)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(event)}\n`

  // Best-effort, ne pas attendre, ne pas faire planter le caller
  void fetch(dsn.envelopeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-sentry-envelope" },
    body,
  }).catch(() => {
    /* silencieux : si Sentry est down, on continue */
  })
}

export function captureMessage(message: string, context?: Omit<CaptureContext, "message">): void {
  const dsn = parseDsn()
  if (!dsn) return

  const eventId = genEventId()
  const now = new Date().toISOString()

  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: context?.level ?? "info",
    message: { formatted: message.slice(0, 2000) },
    environment: process.env.NODE_ENV ?? "production",
    release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    tags: context?.tags ?? {},
    extra: context?.extra ?? {},
  }

  const header = { event_id: eventId, sent_at: now, dsn: process.env.SENTRY_DSN }
  const itemHeader = { type: "event", content_type: "application/json" }
  const body = `${JSON.stringify(header)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(event)}\n`

  void fetch(dsn.envelopeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-sentry-envelope" },
    body,
  }).catch(() => {})
}

function parseStackFrames(stack: string): Array<{ filename?: string; function?: string; lineno?: number; colno?: number }> {
  const lines = stack.split("\n").slice(1, 16)
  const frames: Array<{ filename?: string; function?: string; lineno?: number; colno?: number }> = []
  for (const line of lines) {
    const m = /\s+at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):(\d+)\)?/.exec(line)
    if (m) {
      frames.unshift({
        function: m[1] ?? "<anonymous>",
        filename: m[2],
        lineno: Number(m[3]),
        colno: Number(m[4]),
      })
    }
  }
  return frames
}
