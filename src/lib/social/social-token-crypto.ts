/**
 * Stockage des jetons OAuth sociaux (`SocialAccount.accessToken` / `refreshToken`).
 *
 * ## Format en base (versionné)
 * - **Chiffré (v1)** : `postly:v1:` + **base64url** d’un buffer binaire :
 *   `IV (12 octets) ‖ ciphertext (AES-256-GCM) ‖ authTag (16 octets)`.
 * - **Legacy (clair)** : toute chaîne qui **ne** commence **pas** par `postly:v1:` (comptes
 *   connectés avant déploiement du chiffrement). Lecture seule ; les nouvelles écritures
 *   chiffrent toujours si `SOCIAL_TOKEN_ENCRYPTION_KEY` est défini.
 *
 * ## Clé d’environnement (obligatoire pour toute écriture)
 * - `SOCIAL_TOKEN_ENCRYPTION_KEY` : idéalement **32 octets en base64**
 *   (`openssl rand -base64 32`) ; sinon chaîne UTF-8 → clé = **SHA-256** (32 octets).
 * - Absence de clé : `encryptSocialToken` / `encryptSocialTokensForPersistence` lèvent
 *   `SocialTokenEncryptionConfigurationError` (aucun stockage en clair silencieux).
 *
 * ## Lecture
 * - Non préfixé `postly:v1:` : renvoyé tel quel (**legacy**).
 * - Préfixe présent : déchiffrement AES-256-GCM ; clé absente ou MAC invalide → erreurs
 *   dédiées (**aucun** fragment de secret dans les messages).
 *
 * ## Anti double-chiffrement
 * - `encryptSocialToken` est idempotent si la valeur est déjà au format `postly:v1:`.
 *
 * Exécution **Vercel / serverless** : `node:crypto` uniquement, pas d’état disque.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { SocialAccount } from "@prisma/client";
import { logger } from "@/lib/logger";

/** Préfixe versionné des jetons chiffrés en base (AES-256-GCM). */
export const ENCRYPTED_SOCIAL_TOKEN_PREFIX = "postly:v1:" as const;

const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const AES_KEY_LENGTH = 32;

export class SocialTokenEncryptionConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialTokenEncryptionConfigurationError";
  }
}

/** Déchiffrement ou intégrité : ne jamais inclure de fragment de jeton dans le message. */
export class SocialTokenDecryptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialTokenDecryptError";
  }
}

export function isEncryptedSocialToken(value: string): boolean {
  return value.startsWith(ENCRYPTED_SOCIAL_TOKEN_PREFIX);
}

function deriveKey32FromSecret(secret: string): Buffer {
  try {
    const fromB64 = Buffer.from(secret, "base64");
    if (fromB64.length === AES_KEY_LENGTH) return fromB64;
  } catch {
    /* ignore */
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

function loadEncryptionKey32(): Buffer {
  const raw = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new SocialTokenEncryptionConfigurationError(
      "SOCIAL_TOKEN_ENCRYPTION_KEY est manquant ou vide."
    );
  }
  return deriveKey32FromSecret(raw);
}

/** Indique une erreur du module crypto sociale (config ou déchiffrement). */
export function isSocialTokenCryptoError(
  e: unknown
): e is SocialTokenEncryptionConfigurationError | SocialTokenDecryptError {
  return (
    e instanceof SocialTokenEncryptionConfigurationError ||
    e instanceof SocialTokenDecryptError
  );
}

/**
 * Message sûr pour surfaces utilisateur / agrégats (publication, etc.) : jamais de donnée
 * brute issue de la base, jamais de jeton.
 */
export function safeSocialTokenErrorMessageForClient(e: unknown): string {
  if (e instanceof SocialTokenEncryptionConfigurationError) {
    return "Configuration serveur des comptes sociaux incorrecte (chiffrement). Contactez le support."
  }
  if (e instanceof SocialTokenDecryptError) {
    return "Jeton du compte social invalide ou corrompu. Déconnectez puis reconnectez le réseau."
  }
  return "";
}

/** Log côté serveur sans exposer de secret (uniquement nom d’erreur / statique). */
export function logSocialTokenCryptoFailure(
  scope: string,
  e: unknown
): void {
  if (e instanceof SocialTokenDecryptError) {
    logger.error("social_token.decrypt_failed", {
      route: scope,
      action: "social_token_crypto",
      err: e,
    });
    return;
  }
  if (e instanceof SocialTokenEncryptionConfigurationError) {
    logger.error("social_token.encryption_config", {
      route: scope,
      action: "social_token_crypto",
      err: e,
    });
  }
}

/**
 * Chiffre un jeton pour persistance. Idempotent si déjà au format versionné (évite double chiffrement).
 *
 * @throws SocialTokenEncryptionConfigurationError si clé absente
 */
export function encryptSocialToken(plaintext: string): string {
  if (plaintext === "") return plaintext;
  if (isEncryptedSocialToken(plaintext)) return plaintext;

  const key = loadEncryptionKey32();
  const iv = randomBytes(GCM_IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, ciphertext, tag]);
  return ENCRYPTED_SOCIAL_TOKEN_PREFIX + payload.toString("base64url");
}

/**
 * Déchiffre si format versionné ; sinon renvoie la chaîne telle quelle (**legacy** clair).
 *
 * @throws SocialTokenDecryptError si enveloppe invalide ou clé / MAC incorrects
 * @throws SocialTokenEncryptionConfigurationError si valeur chiffrée mais clé absente
 */
export function decryptSocialToken(stored: string): string {
  if (!isEncryptedSocialToken(stored)) return stored;

  if (!process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim()) {
    throw new SocialTokenEncryptionConfigurationError(
      "Impossible de déchiffrer un jeton chiffré : SOCIAL_TOKEN_ENCRYPTION_KEY est manquant."
    );
  }

  const key = loadEncryptionKey32();
  const b64 = stored.slice(ENCRYPTED_SOCIAL_TOKEN_PREFIX.length);
  let buf: Buffer;
  try {
    buf = Buffer.from(b64, "base64url");
  } catch {
    throw new SocialTokenDecryptError(
      "Jeton social chiffré : encodage invalide."
    );
  }

  if (buf.length < GCM_IV_LENGTH + GCM_TAG_LENGTH + 1) {
    throw new SocialTokenDecryptError(
      "Jeton social chiffré : données incomplètes ou corrompues."
    );
  }

  const iv = buf.subarray(0, GCM_IV_LENGTH);
  const tag = buf.subarray(buf.length - GCM_TAG_LENGTH);
  const enc = buf.subarray(GCM_IV_LENGTH, buf.length - GCM_TAG_LENGTH);

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return (
      decipher.update(enc, undefined, "utf8") + decipher.final("utf8")
    );
  } catch {
    throw new SocialTokenDecryptError(
      "Jeton social : déchiffrement impossible (clé incorrecte ou données altérées)."
    );
  }
}

/** Paire de jetons à persister en base (toujours chiffrés si clé configurée). */
export function encryptSocialTokensForPersistence(data: {
  accessToken: string;
  refreshToken?: string | null | undefined;
}): { accessToken: string; refreshToken?: string | null } {
  const out: { accessToken: string; refreshToken?: string | null } = {
    accessToken: encryptSocialToken(data.accessToken),
  };
  if (data.refreshToken !== undefined) {
    out.refreshToken =
      data.refreshToken == null || data.refreshToken === ""
        ? null
        : encryptSocialToken(data.refreshToken);
  }
  return out;
}

/**
 * Copie métier avec jetons utilisables pour les appels API (déchiffrement + legacy clair).
 *
 * @throws SocialTokenDecryptError | SocialTokenEncryptionConfigurationError
 */
export function decryptSocialAccountForUse(
  account: SocialAccount
): SocialAccount {
  return {
    ...account,
    accessToken: decryptSocialToken(account.accessToken),
    refreshToken:
      account.refreshToken == null || account.refreshToken === ""
        ? null
        : decryptSocialToken(account.refreshToken),
  };
}
