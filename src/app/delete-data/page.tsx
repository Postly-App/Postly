import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Suppression de données — Postly",
  description:
    "Comment supprimer définitivement votre compte Postly et toutes les données associées (RGPD, Meta App Review).",
};

const STEPS = [
  {
    n: 1,
    title: "Connectez-vous à votre compte Postly",
    body: "Rendez-vous sur https://www.getpostly.space/login et connectez-vous avec l'email utilisé lors de l'inscription.",
  },
  {
    n: 2,
    title: "Allez dans Paramètres → Données",
    body: "Une fois connecté, ouvrez la page Paramètres puis l'onglet Compte. Vous y trouverez le bouton « Supprimer mon compte ».",
  },
  {
    n: 3,
    title: "Confirmez la suppression",
    body: "Cette action est irréversible et déclenche la purge automatique de toutes vos données dans un délai maximum de 30 jours, conformément au RGPD.",
  },
];

const ALT_STEPS = [
  {
    title: "Demande par email",
    body: "Si vous ne pouvez plus accéder à votre compte, envoyez un email à support@getpostly.space depuis l'adresse email associée à votre compte Postly. Précisez « Demande de suppression — RGPD ». Nous traitons toutes les demandes sous 30 jours.",
  },
  {
    title: "Demande via OAuth provider",
    body: "Si vous aviez connecté Postly à Facebook ou Instagram, vous pouvez aussi révoquer l'accès depuis vos paramètres Facebook (Paramètres → Apps et sites web). Cela coupe nos accès, et nous purgeons automatiquement les jetons OAuth associés.",
  },
];

const WHAT_GETS_DELETED = [
  "Profil utilisateur (nom, email, mot de passe haché, avatar généré)",
  "Tous vos posts (brouillons, planifiés, publiés, échoués)",
  "Tous les jetons OAuth des réseaux sociaux connectés (Facebook, Instagram, Threads, X/Twitter, TikTok, YouTube, etc.)",
  "Toutes les données d'analytics collectées (reach, likes, commentaires, partages)",
  "Tous les médias uploadés via UploadThing",
  "Identifiants Stripe (customer ID, subscription ID — les données de paiement restent chez Stripe selon leur durée de conservation propre, généralement 7 ans pour obligations légales)",
  "Conversations avec l'assistant IA (déjà non-persistées au-delà de la session active)",
  "Membres d'équipe et clients liés à votre compte (plan Agence)",
  "Clés API publiques générées (plan Agence)",
  "Logs d'audit associés à votre userId (anonymisation immédiate, suppression sous 30 jours)",
];

export default function DeleteDataPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0F",
        color: "#F1F0FF",
        fontFamily: "var(--font)",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <Logo size={28} />
        </div>

        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            marginBottom: 8,
          }}
        >
          Suppression de vos données
        </h1>
        <p style={{ color: "#9B99B5", marginBottom: 36, fontSize: "0.9rem" }}>
          Conformité RGPD · Meta Platform Terms · Dernière mise à jour : 18 mai 2026
        </p>

        <p
          style={{
            color: "#B4BCD0",
            lineHeight: 1.7,
            fontSize: "0.95rem",
            marginBottom: 28,
          }}
        >
          Postly respecte votre droit à la suppression. Vous pouvez à tout moment
          supprimer votre compte et toutes les données associées — directement
          depuis l&apos;application, ou en nous contactant.
        </p>

        {/* ── Procédure principale ─────────────────────────── */}
        <section
          style={{
            marginBottom: 32,
            padding: 24,
            borderRadius: 16,
            background: "rgba(124,92,252,0.06)",
            border: "1px solid rgba(124,92,252,0.20)",
          }}
        >
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "#F1F0FF",
            }}
          >
            Procédure depuis l&apos;application (recommandée)
          </h2>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {STEPS.map((s) => (
              <li
                key={s.n}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                  }}
                >
                  {s.n}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.92rem",
                      marginBottom: 4,
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      color: "#9B99B5",
                      lineHeight: 1.65,
                      fontSize: "0.88rem",
                    }}
                  >
                    {s.body}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <Link
              href="/login?callbackUrl=/settings/data"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                borderRadius: 12,
                background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.88rem",
                textDecoration: "none",
                boxShadow: "0 0 16px rgba(124,92,252,0.35)",
              }}
            >
              Se connecter et supprimer mon compte →
            </Link>
            <a
              href="mailto:support@getpostly.space?subject=Demande%20de%20suppression%20%E2%80%94%20RGPD"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#F1F0FF",
                fontWeight: 600,
                fontSize: "0.88rem",
                textDecoration: "none",
              }}
            >
              Demande par email
            </a>
          </div>
        </section>

        {/* ── Procédures alternatives ──────────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14 }}>
            Procédures alternatives
          </h2>
          {ALT_STEPS.map((s) => (
            <div
              key={s.title}
              style={{
                padding: 18,
                borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: 6 }}>
                {s.title}
              </div>
              <div
                style={{
                  color: "#9B99B5",
                  lineHeight: 1.65,
                  fontSize: "0.88rem",
                }}
              >
                {s.body}
              </div>
            </div>
          ))}
        </section>

        {/* ── Détail des données supprimées ────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14 }}>
            Ce qui est supprimé
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {WHAT_GETS_DELETED.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom:
                    i < WHAT_GETS_DELETED.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                  fontSize: "0.88rem",
                  color: "#B4BCD0",
                  lineHeight: 1.55,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: "rgba(34,211,160,0.18)",
                    border: "1px solid rgba(34,211,160,0.45)",
                    color: "#22D3A0",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    marginTop: 3,
                  }}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Délais et conservation ───────────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 10 }}>
            Délais
          </h2>
          <p
            style={{
              color: "#9B99B5",
              lineHeight: 1.7,
              fontSize: "0.92rem",
              marginBottom: 10,
            }}
          >
            Toutes les données sont définitivement supprimées sous{" "}
            <strong style={{ color: "#F1F0FF" }}>30 jours maximum</strong>{" "}
            à compter de votre demande. Les jetons OAuth sont révoqués
            immédiatement (vous pouvez le constater dans vos paramètres
            Facebook, X, etc.). La suppression effective en base intervient
            dans un cycle batch quotidien.
          </p>
          <p
            style={{
              color: "#9B99B5",
              lineHeight: 1.7,
              fontSize: "0.92rem",
            }}
          >
            Les données conservées au-delà de ce délai (uniquement pour
            obligations légales — factures Stripe par exemple) sont
            détaillées dans notre{" "}
            <Link href="/privacy" style={{ color: "#9B82FD", fontWeight: 600 }}>
              politique de confidentialité
            </Link>
            .
          </p>
        </section>

        {/* ── Export RGPD ──────────────────────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 10 }}>
            Avant suppression : exporter mes données
          </h2>
          <p
            style={{
              color: "#9B99B5",
              lineHeight: 1.7,
              fontSize: "0.92rem",
              marginBottom: 14,
            }}
          >
            Si vous souhaitez d&apos;abord récupérer une copie de vos données
            (droit à la portabilité), connectez-vous puis allez dans Paramètres
            → Compte → « Exporter mes données ». Vous recevrez un fichier JSON
            complet.
          </p>
          <Link
            href="/login?callbackUrl=/settings"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#F1F0FF",
              fontWeight: 600,
              fontSize: "0.86rem",
              textDecoration: "none",
            }}
          >
            Se connecter pour exporter →
          </Link>
        </section>

        {/* ── Contact ──────────────────────────────────────── */}
        <section
          style={{
            marginBottom: 32,
            padding: 20,
            borderRadius: 14,
            background: "rgba(34,211,160,0.04)",
            border: "1px solid rgba(34,211,160,0.18)",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: 8,
              color: "#F1F0FF",
            }}
          >
            Une question ? Un problème ?
          </h2>
          <p
            style={{
              color: "#9B99B5",
              lineHeight: 1.65,
              fontSize: "0.9rem",
              marginBottom: 10,
            }}
          >
            Écrivez-nous à{" "}
            <a
              href="mailto:support@getpostly.space"
              style={{ color: "#22D3A0", fontWeight: 600, textDecoration: "none" }}
            >
              support@getpostly.space
            </a>{" "}
            — réponse sous 48h ouvrées.
          </p>
        </section>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ color: "#9B82FD", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
            ← Retour à l&apos;accueil
          </Link>
          <Link href="/privacy" style={{ color: "#9B99B5", fontSize: "0.9rem", textDecoration: "none" }}>
            Politique de confidentialité
          </Link>
          <Link href="/terms" style={{ color: "#9B99B5", fontSize: "0.9rem", textDecoration: "none" }}>
            Conditions générales
          </Link>
        </div>
      </div>
    </div>
  );
}
