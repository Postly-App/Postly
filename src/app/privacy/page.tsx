import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Politique de confidentialité — Postly",
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. Responsable du traitement",
    paragraphs: [
      "Le responsable du traitement de vos données personnelles est Postly. Pour toute question : postlyservice@gmail.com.",
    ],
  },
  {
    title: "2. Données collectées",
    paragraphs: [
      "Données de compte : nom, adresse email, mot de passe haché (bcrypt), photo de profil (le cas échéant).",
      "Données de facturation : identifiants Stripe (customer ID, subscription ID, prix souscrit). Aucune donnée carte n'est stockée par Postly ; tout est traité par Stripe.",
      "Données d'utilisation : posts créés, comptes sociaux connectés, statistiques d'engagement collectées via les API publiques des plateformes, journaux d'événements (logs serveur anonymisés).",
      "Jetons OAuth des réseaux sociaux : chiffrés en base avec AES-256-GCM. Utilisés uniquement pour publier en votre nom sur les réseaux que vous avez explicitement connectés.",
      "Conversations avec l'assistant IA : envoyées à OpenAI (assistant dashboard) ou Groq (chatbot landing) pour génération de réponses. Nous ne conservons pas les conversations IA au-delà de la session.",
    ],
  },
  {
    title: "3. Finalités du traitement",
    paragraphs: [
      "Fournir le Service : authentification, planification de posts, publication via API tierces, analyse de performance.",
      "Gérer la facturation et l'abonnement via Stripe.",
      "Envoyer des emails transactionnels (confirmation d'inscription, confirmation de paiement, alertes de paiement échoué, invitations d'équipe).",
      "Améliorer le Service via des logs d'erreur agrégés et anonymisés.",
    ],
  },
  {
    title: "4. Bases légales",
    paragraphs: [
      "Exécution du contrat (CGU) : compte, abonnement, publication.",
      "Intérêt légitime : sécurité, prévention des abus, logs d'erreur.",
      "Consentement : lorsqu'il est requis (par exemple cookies non essentiels — non utilisés actuellement).",
    ],
  },
  {
    title: "5. Destinataires et sous-traitants",
    paragraphs: [
      "Vos données sont transmises uniquement à nos sous-traitants techniques, dans le strict nécessaire à la fourniture du Service :",
      "Vercel (hébergement de l'application) — USA, signature SCC pour transferts hors UE.",
      "Supabase (base de données PostgreSQL) — UE (région eu-west).",
      "Stripe (facturation et paiement) — USA + UE.",
      "Resend (emails transactionnels) — USA.",
      "UploadThing (stockage des médias uploadés) — USA.",
      "OpenAI et Groq (génération de texte par l'assistant IA) — USA. Les messages envoyés à l'IA ne sont pas utilisés pour entraîner les modèles (clauses API).",
      "Upstash (cache et rate limiting) — UE/USA.",
      "Les API publiques des réseaux sociaux que vous connectez (Meta, X/Twitter, Google/YouTube, TikTok, etc.) reçoivent uniquement le contenu que vous publiez explicitement.",
      "Aucune donnée n'est vendue à des tiers ni utilisée à des fins publicitaires.",
    ],
  },
  {
    title: "6. Durée de conservation",
    paragraphs: [
      "Données de compte : pendant toute la durée de votre abonnement et 30 jours après suppression du compte (purge automatique).",
      "Données de facturation : 10 ans pour répondre aux obligations comptables et fiscales françaises.",
      "Logs serveur : 30 jours.",
      "Jetons OAuth : supprimés immédiatement lors de la déconnexion du réseau social ou de la suppression du compte.",
    ],
  },
  {
    title: "7. Vos droits (RGPD)",
    paragraphs: [
      "Conformément au RGPD, vous disposez des droits suivants :",
      "Droit d'accès et de portabilité : vous pouvez exporter une copie de vos données depuis l'espace Paramètres → Mes données, ou en nous écrivant.",
      "Droit de rectification : vous pouvez corriger votre nom et email depuis votre profil.",
      "Droit à l'effacement : vous pouvez supprimer définitivement votre compte depuis l'espace Paramètres → Mes données. Cette action supprime également vos posts, jetons sociaux et historique d'analytics.",
      "Droit d'opposition et de limitation : écrivez-nous à postlyservice@gmail.com.",
      "Vous pouvez à tout moment introduire une réclamation auprès de la CNIL (www.cnil.fr).",
    ],
  },
  {
    title: "8. Sécurité",
    paragraphs: [
      "Mots de passe hachés avec bcrypt (12 rounds).",
      "Jetons OAuth chiffrés en base avec AES-256-GCM.",
      "Sessions JWT signées avec une clé secrète serveur, renouvelées tous les 14 jours.",
      "HTTPS forcé sur tout le service.",
      "Limitation de débit (rate limiting) sur les endpoints sensibles.",
    ],
  },
  {
    title: "9. Cookies",
    paragraphs: [
      "Postly utilise uniquement des cookies strictement nécessaires au fonctionnement (cookie de session NextAuth httpOnly + cookie client actif AGENCY). Aucun cookie publicitaire, aucun cookie de tracking tiers, aucun pixel Facebook/Google.",
    ],
  },
  {
    title: "10. Modifications",
    paragraphs: [
      "Postly peut modifier cette politique. Toute modification substantielle sera notifiée par email.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#F1F0FF", fontFamily: "var(--font)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <Logo size={28} />
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>
          Politique de confidentialité
        </h1>
        <p style={{ color: "#9B99B5", marginBottom: 36, fontSize: "0.9rem" }}>
          Dernière mise à jour : 14 mai 2026 · Version 1.0
        </p>

        {SECTIONS.map(({ title, paragraphs }) => (
          <section key={title} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 10 }}>{title}</h2>
            {paragraphs.map((p, i) => (
              <p key={i} style={{ color: "#9B99B5", lineHeight: 1.7, fontSize: "0.92rem", marginBottom: 10 }}>
                {p}
              </p>
            ))}
          </section>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/" style={{ color: "#9B82FD", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
