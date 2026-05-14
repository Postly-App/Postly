import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Conditions Générales d'Utilisation — Postly",
};

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "1. Acceptation des conditions",
    paragraphs: [
      "En créant un compte ou en utilisant le service Postly (le « Service »), vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation (« CGU »). Si vous n'acceptez pas ces conditions, n'utilisez pas le Service.",
      "Les présentes CGU forment un contrat entre vous (« Utilisateur ») et Postly (« nous »).",
    ],
  },
  {
    title: "2. Description du Service",
    paragraphs: [
      "Postly est un logiciel en mode SaaS permettant de planifier, publier et analyser des contenus sur des réseaux sociaux tiers (Instagram, Facebook, Twitter/X, LinkedIn, TikTok, YouTube, Threads, Pinterest).",
      "Le Service repose sur les API publiques de ces plateformes. Postly n'est pas affilié à ces plateformes et n'est pas responsable de leurs interruptions, modifications d'API ou décisions de modération.",
    ],
  },
  {
    title: "3. Compte utilisateur",
    paragraphs: [
      "Vous êtes responsable de la confidentialité de votre mot de passe et de toute activité réalisée sous votre compte. Vous devez nous notifier sans délai à postlyservice@gmail.com en cas d'accès non autorisé.",
      "Vous garantissez avoir au moins 18 ans et avoir la capacité légale de contracter.",
    ],
  },
  {
    title: "4. Plans d'abonnement et facturation",
    paragraphs: [
      "Trois plans sont proposés : Gratuit, Pro (29 €/mois ou 17 €/mois facturé annuellement) et Agence (79 €/mois ou 47 €/mois facturé annuellement). Les fonctionnalités incluses sont décrites sur la page Tarifs.",
      "Le plan Pro inclut une période d'essai gratuite de 7 jours. Aucun moyen de paiement n'est débité avant la fin de la période d'essai.",
      "La facturation est gérée par Stripe. En souscrivant un plan payant, vous autorisez Postly à débiter votre moyen de paiement de manière récurrente jusqu'à annulation.",
      "L'annulation prend effet à la fin de la période de facturation en cours. Aucun remboursement partiel n'est effectué, sauf disposition légale impérative contraire (notamment droit de rétractation de 14 jours pour les consommateurs au sens du Code de la consommation français, sauf si l'exécution du Service a commencé avec votre accord exprès avant la fin de ce délai).",
      "Les prix s'entendent hors taxes. La TVA applicable est ajoutée selon la juridiction.",
    ],
  },
  {
    title: "5. Utilisation acceptable",
    paragraphs: [
      "Vous vous engagez à ne pas utiliser le Service pour publier du contenu illégal, diffamatoire, haineux, pornographique, ou violant les droits de propriété intellectuelle de tiers.",
      "Vous vous engagez à respecter les conditions d'utilisation propres à chaque réseau social tiers connecté à votre compte Postly. Toute suspension de votre compte sur un réseau social tiers ne donne pas droit à un remboursement.",
      "Postly se réserve le droit de suspendre ou supprimer un compte enfreignant ces règles, sans préavis et sans remboursement.",
    ],
  },
  {
    title: "6. Propriété intellectuelle",
    paragraphs: [
      "Le code, la marque, les interfaces et le design de Postly restent la propriété exclusive de Postly. Aucune licence ou droit n'est cédé à l'Utilisateur en dehors d'un droit d'usage personnel non transférable.",
      "Vous conservez la propriété de tous les contenus que vous publiez via Postly. Vous nous accordez une licence non exclusive, gratuite et limitée au strict nécessaire pour héberger et publier vos contenus sur les réseaux sociaux tiers que vous avez désignés.",
    ],
  },
  {
    title: "7. Disponibilité et limitation de responsabilité",
    paragraphs: [
      "Postly s'efforce d'assurer la disponibilité du Service mais ne garantit pas une disponibilité ininterrompue. Le Service est fourni « en l'état », sans garantie autre que celles imposées par la loi.",
      "Dans les limites permises par la loi applicable, la responsabilité totale cumulée de Postly est limitée au montant des sommes payées par l'Utilisateur au cours des 12 derniers mois.",
    ],
  },
  {
    title: "8. Résiliation",
    paragraphs: [
      "Vous pouvez résilier votre abonnement à tout moment depuis votre espace facturation. La résiliation prend effet à la fin de la période en cours.",
      "Postly peut résilier un compte en cas de manquement grave aux CGU, après notification raisonnable lorsque cela est possible.",
    ],
  },
  {
    title: "9. Données personnelles",
    paragraphs: [
      "Le traitement de vos données personnelles est décrit dans notre Politique de confidentialité. Vous pouvez à tout moment exporter ou supprimer vos données depuis l'espace Paramètres.",
    ],
  },
  {
    title: "10. Modifications des CGU",
    paragraphs: [
      "Postly peut modifier les présentes CGU. Toute modification substantielle vous sera notifiée par email au moins 30 jours avant son entrée en vigueur. Vous pouvez résilier votre abonnement sans frais si vous refusez les nouvelles conditions.",
    ],
  },
  {
    title: "11. Droit applicable et juridiction",
    paragraphs: [
      "Les présentes CGU sont régies par le droit français. Tout litige relève des tribunaux compétents du ressort du siège social de Postly, sous réserve des règles d'ordre public applicables aux consommateurs.",
    ],
  },
  {
    title: "12. Contact",
    paragraphs: [
      "Pour toute question relative aux CGU ou au Service : postlyservice@gmail.com",
    ],
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#F1F0FF", fontFamily: "var(--font)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <Logo size={28} />
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>
          Conditions Générales d&apos;Utilisation
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
