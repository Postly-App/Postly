/** Erreurs métier publication (API HTTP mapping côté route). */

export class ConcurrentPublishInProgressError extends Error {
  constructor() {
    super("Une publication est déjà en cours pour ce post.")
    this.name = "ConcurrentPublishInProgressError"
  }
}

/**
 * Le post n'existe plus, n'appartient pas à cet utilisateur, ou est déjà
 * dans un état terminal qui empêche la publication (déjà PUBLISHED).
 * Mappé en HTTP 404 côté route, pas 500.
 */
export class PostNotPublishableError extends Error {
  constructor(message = "Post introuvable ou déjà traité.") {
    super(message)
    this.name = "PostNotPublishableError"
  }
}
