/** Erreurs métier publication (API HTTP mapping côté route). */

export class ConcurrentPublishInProgressError extends Error {
  constructor() {
    super("Une publication est déjà en cours pour ce post.")
    this.name = "ConcurrentPublishInProgressError"
  }
}
