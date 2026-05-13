/**
 * Exécuté une fois au démarrage du runtime Node (hors Edge / middleware).
 * Valide la configuration auth critique en production.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertProductionAuthEnvironment } = await import("@/lib/env/auth");
  assertProductionAuthEnvironment();
}
