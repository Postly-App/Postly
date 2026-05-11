import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? "Postly <onboarding@resend.dev>"

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (e) {
    console.error("Email send failed:", e)
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
