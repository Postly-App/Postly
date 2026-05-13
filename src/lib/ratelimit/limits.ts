/**
 * Quotas appliqués (Upstash sliding window).
 * Ajustables via ce fichier central.
 */
export const RATE_LIMITS = {
  /** Connexion credentials — anti brute-force par IP */
  loginIp: { max: 20, window: "10 m" as const },
  /** Connexion credentials — par email (compte ciblé) */
  loginEmail: { max: 8, window: "15 m" as const },
  /** Inscription — anti spam comptes */
  registerIp: { max: 5, window: "1 h" as const },
  /** Mot de passe oublié — par IP */
  forgotIp: { max: 5, window: "1 h" as const },
  /** Mot de passe oublié — par email (anti bombing) */
  forgotEmail: { max: 3, window: "1 h" as const },
  /** Publication réseaux — par utilisateur authentifié */
  publishUser: { max: 40, window: "1 h" as const },
  /** Assistant IA dashboard — par utilisateur */
  aiChatUser: { max: 35, window: "1 h" as const },
  /** Webhook Stripe — anti flood avant vérif signature */
  stripeIp: { max: 120, window: "1 m" as const },
} as const
