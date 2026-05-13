import { Resend } from "resend"
import { logger } from "@/lib/logger"

const FROM = process.env.RESEND_FROM ?? "Postly <onboarding@resend.dev>"

let resendSingleton: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!resendSingleton) resendSingleton = new Resend(key)
  return resendSingleton
}

async function send(to: string, subject: string, html: string) {
  const resend = getResend()
  if (!resend) return
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (e) {
    logger.error("email.send_failed", {
      route: "lib:client",
      action: "send",
      err: e,
    })
  }
}

export const sendPaymentSuccessEmail = (to: string) =>
  send(to, "Paiement reçu ✅", "<p>Merci, ton paiement a bien été reçu.</p>")

export const sendPaymentFailedEmail = (to: string) =>
  send(to, "Échec du paiement", "<p>Ton dernier paiement a échoué. Mets à jour ta carte.</p>")

export const sendSubscriptionCanceledEmail = (to: string) =>
  send(to, "Abonnement annulé", "<p>Ton abonnement a été annulé.</p>")

export const sendTrialEndingEmail = (to: string) =>
  send(to, "Ton essai se termine bientôt", "<p>Ton essai se termine dans quelques jours.</p>")
