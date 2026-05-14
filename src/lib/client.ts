import { Resend } from "resend"
import { logger } from "@/lib/logger"

const FROM = process.env.RESEND_FROM ?? "Postly <onboarding@resend.dev>"
const APP_URL = process.env.NEXTAUTH_URL ?? "https://www.getpostly.space"

let resendSingleton: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!resendSingleton) resendSingleton = new Resend(key)
  return resendSingleton
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const resend = getResend()
  if (!resend) {
    logger.warn("email.skipped_no_key", { route: "lib:client", to: to.split("@")[0]?.slice(0, 2) + "***" })
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (e) {
    logger.error("email.send_failed", { route: "lib:client", err: e })
  }
}

/** Layout HTML cohérent pour tous les emails Postly (dark + brand purple). */
function layout(opts: {
  preheader: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaHref?: string
  footerNote?: string
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(opts.title)}</title>
<style>
  body { margin:0; padding:0; background:#0A0A0F; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; color:#E8E7F1; }
  .wrap { max-width:560px; margin:0 auto; padding:32px 20px; }
  .card { background:#111118; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:36px 30px; }
  h1 { font-size:22px; font-weight:800; margin:0 0 14px; color:#fff; letter-spacing:-0.3px; }
  p { font-size:15px; line-height:1.6; margin:0 0 12px; color:#C5C4DA; }
  .brand { font-size:18px; font-weight:800; background:linear-gradient(135deg,#7C5CFC,#F06292); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .cta { display:inline-block; margin-top:18px; padding:13px 26px; border-radius:10px; background:linear-gradient(135deg,#7C5CFC,#5B3EE8); color:#fff !important; font-weight:700; text-decoration:none; font-size:15px; }
  .muted { color:#5C5A75; font-size:12px; line-height:1.5; margin-top:18px; }
  .preheader { display:none; visibility:hidden; opacity:0; max-height:0; max-width:0; overflow:hidden; }
  a { color:#9B82FD; }
</style>
</head>
<body>
<div class="preheader">${escape(opts.preheader)}</div>
<div class="wrap">
  <div style="margin-bottom:20px;">
    <span class="brand">Postly</span>
  </div>
  <div class="card">
    <h1>${escape(opts.title)}</h1>
    ${opts.bodyHtml}
    ${opts.ctaLabel && opts.ctaHref ? `<a href="${escape(opts.ctaHref)}" class="cta">${escape(opts.ctaLabel)}</a>` : ""}
    ${opts.footerNote ? `<p class="muted">${opts.footerNote}</p>` : ""}
  </div>
  <p class="muted" style="text-align:center; margin-top:24px;">
    Postly · <a href="${escape(APP_URL)}">${escape(APP_URL.replace(/^https?:\/\//, ""))}</a><br>
    Tu reçois cet email parce que tu as un compte Postly.
  </p>
</div>
</body>
</html>`
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendWelcomeEmail(to: string, name: string | null): Promise<void> {
  const first = name?.split(" ")[0] ?? "toi"
  await send(
    to,
    "Bienvenue sur Postly 🎉",
    layout({
      preheader: "Ton compte Postly est prêt. Commence en 2 minutes.",
      title: `Bienvenue ${escape(first)} !`,
      bodyHtml: `
        <p>Ton compte Postly est créé. Tu peux dès maintenant :</p>
        <p>
          • Connecter ton 1er compte social<br>
          • Planifier ton premier post<br>
          • Découvrir l&rsquo;assistant IA (plans Pro+)
        </p>
      `,
      ctaLabel: "Aller au dashboard",
      ctaHref: `${APP_URL}/dashboard`,
      footerNote: "Tu n&rsquo;as pas créé ce compte ? Ignore cet email.",
    })
  )
}

export async function sendPaymentSuccessEmail(to: string, plan?: string): Promise<void> {
  const planLabel = plan === "AGENCY" ? "Agence" : plan === "PRO" ? "Pro" : "ton plan"
  await send(
    to,
    "Paiement reçu ✅",
    layout({
      preheader: "Ton abonnement est actif.",
      title: `Bienvenue sur Postly ${escape(planLabel)}`,
      bodyHtml: `
        <p>Ton paiement a bien été enregistré. Toutes les fonctionnalités de ton plan sont désormais débloquées.</p>
        <p>Tu peux gérer ton abonnement et télécharger tes factures à tout moment depuis ton espace facturation.</p>
      `,
      ctaLabel: "Voir mon abonnement",
      ctaHref: `${APP_URL}/billing`,
    })
  )
}

export async function sendPaymentFailedEmail(to: string): Promise<void> {
  await send(
    to,
    "Échec de paiement",
    layout({
      preheader: "Mets à jour ta carte pour éviter une interruption.",
      title: "Ton dernier paiement a échoué",
      bodyHtml: `
        <p>Le prélèvement de ton abonnement Postly n&rsquo;a pas pu aboutir. Pour conserver l&rsquo;accès à toutes
        tes fonctionnalités, mets à jour ta carte bancaire sous quelques jours.</p>
      `,
      ctaLabel: "Mettre à jour ma carte",
      ctaHref: `${APP_URL}/billing`,
    })
  )
}

export async function sendSubscriptionCanceledEmail(to: string): Promise<void> {
  await send(
    to,
    "Abonnement annulé",
    layout({
      preheader: "Ton accès Pro/Agence se termine à la fin de la période.",
      title: "Abonnement annulé",
      bodyHtml: `
        <p>Ton abonnement a bien été annulé. Tu gardes l&rsquo;accès aux fonctionnalités payantes jusqu&rsquo;à
        la fin de ta période en cours, puis tu repasseras automatiquement au plan Gratuit.</p>
        <p>Tu peux réactiver à tout moment depuis ton espace facturation.</p>
      `,
      ctaLabel: "Revenir sur Postly",
      ctaHref: `${APP_URL}/billing`,
    })
  )
}

export async function sendTrialEndingEmail(to: string): Promise<void> {
  await send(
    to,
    "Ton essai se termine bientôt",
    layout({
      preheader: "Ajoute une carte pour continuer sans interruption.",
      title: "Ton essai gratuit se termine bientôt",
      bodyHtml: `
        <p>Il te reste quelques jours d&rsquo;essai Postly Pro. Pense à ajouter un moyen de paiement
        pour éviter toute interruption à la fin de l&rsquo;essai.</p>
      `,
      ctaLabel: "Configurer mon paiement",
      ctaHref: `${APP_URL}/billing`,
    })
  )
}

export async function sendTeamInvitationEmail(
  to: string,
  opts: { teamName: string; inviterName: string | null; inviteUrl: string; role: "ADMIN" | "MEMBER" }
): Promise<void> {
  const inviter = opts.inviterName ?? "Un administrateur"
  const roleLabel = opts.role === "ADMIN" ? "Admin" : "Membre"
  await send(
    to,
    `${inviter} t'invite à rejoindre ${opts.teamName}`,
    layout({
      preheader: `Tu es invité à rejoindre ${opts.teamName} sur Postly.`,
      title: `${escape(inviter)} t&rsquo;invite à rejoindre ${escape(opts.teamName)}`,
      bodyHtml: `
        <p>Tu es invité à rejoindre l&rsquo;équipe <strong>${escape(opts.teamName)}</strong> sur Postly en
        tant que <strong>${escape(roleLabel)}</strong>.</p>
        <p>Clique sur le bouton ci-dessous pour accepter. Le lien expire dans 7 jours.</p>
      `,
      ctaLabel: "Accepter l'invitation",
      ctaHref: opts.inviteUrl,
      footerNote: `Si tu ne connais pas ${escape(inviter)}, ignore simplement cet email.`,
    })
  )
}
