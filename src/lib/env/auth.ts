/**
 * Validation centralisée des variables d’environnement liées à NextAuth.
 * Aucun secret n’est jamais loggé.
 */

import { logger } from "@/lib/logger"

const IS_PRODUCTION = process.env.NODE_ENV === "production"

/** `next build` : NODE_ENV=production sans charger .env.local — évite d’échouer la collecte de pages. */
function isNextProductionBuildPhase(): boolean {
  if (!IS_PRODUCTION) return false
  return (
    process.env.npm_lifecycle_event === "build" ||
    process.env.NEXT_PHASE === "phase-production-build"
  )
}

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthConfigError"
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Secret NextAuth : obligatoire dès que l’auth est utilisée (dev inclus pour éviter le repli SHA instable).
 * En production, longueur minimale renforcée.
 */
export function getNextAuthSecret(): string {
  const raw = process.env.NEXTAUTH_SECRET?.trim()
  if (raw) {
    if (IS_PRODUCTION && raw.length < 32) {
      logger.warn("auth.secret.short", {
        route: "env:auth",
        action: "getNextAuthSecret",
        outcome: "warn_short_secret",
      })
    }
    return raw
  }

  if (isNextProductionBuildPhase()) {
    if (!(globalThis as { __postlyAuthBuildSecretWarned?: boolean }).__postlyAuthBuildSecretWarned) {
      ;(globalThis as { __postlyAuthBuildSecretWarned?: boolean }).__postlyAuthBuildSecretWarned = true
      logger.warn("auth.secret.missing_during_build", {
        route: "env:auth",
        action: "getNextAuthSecret",
        outcome: "placeholder_used",
      })
    }
    return "__nextauth_build_placeholder_never_deploy_without_real_secret__"
  }

  if (IS_PRODUCTION) {
    throw new AuthConfigError(
      "NEXTAUTH_SECRET est obligatoire en production. Générez-le avec : openssl rand -base64 32"
    )
  }
  throw new AuthConfigError(
    "NEXTAUTH_SECRET est manquant. Ajoutez-le dans .env.local (ex. openssl rand -base64 32)."
  )
}

/**
 * Détermine si les cookies NextAuth doivent être marqués Secure / préfixe __Secure-.
 * Basé sur NEXTAUTH_URL (prioritaire) puis indicateurs Vercel.
 */
export function resolveUseSecureCookies(): boolean {
  const explicit = process.env.NEXTAUTH_URL?.trim()
  if (explicit?.startsWith("https://")) return true
  if (explicit?.startsWith("http://")) return false
  return process.env.VERCEL === "1"
}

/**
 * Vérifie la cohérence de NEXTAUTH_URL (sans logger la valeur complète).
 */
export function validateNextAuthUrlConfig(): void {
  const url = process.env.NEXTAUTH_URL?.trim()
  if (!url) {
    if (IS_PRODUCTION && process.env.VERCEL) {
      logger.warn("auth.nextauth_url.missing_on_vercel", {
        route: "env:auth",
        action: "validateNextAuthUrlConfig",
      })
    }
    return
  }
  try {
    const u = new URL(url)
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      logger.warn("auth.nextauth_url.invalid_scheme", {
        route: "env:auth",
        action: "validateNextAuthUrlConfig",
      })
    }
    if (IS_PRODUCTION && u.protocol !== "https:") {
      logger.warn("auth.nextauth_url.http_in_production", {
        route: "env:auth",
        action: "validateNextAuthUrlConfig",
      })
    }
    if (url.includes("\n") || url.includes(" ") || url !== url.trim()) {
      logger.warn("auth.nextauth_url.malformed_whitespace", {
        route: "env:auth",
        action: "validateNextAuthUrlConfig",
      })
    }
  } catch {
    logger.warn("auth.nextauth_url.parse_failed", {
      route: "env:auth",
      action: "validateNextAuthUrlConfig",
    })
  }
}

/**
 * Appelé au démarrage serveur (instrumentation) : échoue tôt si la prod est mal configurée.
 */
export function assertProductionAuthEnvironment(): void {
  if (!IS_PRODUCTION) return
  if (isNextProductionBuildPhase()) return
  const secret = process.env.NEXTAUTH_SECRET?.trim()
  if (!secret) {
    const msg =
      "NEXTAUTH_SECRET est obligatoire en production. Définissez la variable sur votre hébergeur (Vercel → Settings → Environment Variables)."
    logger.error("auth.fatal.missing_secret", { route: "env:auth", action: "assertProductionAuthEnvironment" })
    throw new AuthConfigError(msg)
  }
  const url = process.env.NEXTAUTH_URL?.trim()
  if (url && !isHttpsUrl(url)) {
    logger.warn("auth.nextauth_url.not_https", {
      route: "env:auth",
      action: "assertProductionAuthEnvironment",
    })
  }
  if (!url && process.env.VERCEL) {
    logger.warn("auth.nextauth_url.missing_custom_domain_hint", {
      route: "env:auth",
      action: "assertProductionAuthEnvironment",
    })
  }
}
