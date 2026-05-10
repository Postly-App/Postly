import Link from "next/link";
import Logo from "@/components/Logo";

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#F1F0FF", fontFamily: "var(--font)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <Logo size={28} />
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>Conditions Générales d&apos;Utilisation</h1>
        <p style={{ color: "#9B99B5", marginBottom: 40, fontSize: "0.9rem" }}>Dernière mise à jour : mai 2026</p>

        <div style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 40 }}>
          <p style={{ color: "#9B82FD", fontSize: "0.9rem", fontWeight: 600 }}>
            📋 Ce document est en cours de rédaction par notre équipe juridique. La version complète sera disponible avant le lancement officiel de Postly.
          </p>
        </div>

        {[
          { title: "1. Acceptation des conditions", content: "En utilisant Postly, vous acceptez d'être lié par les présentes conditions. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service." },
          { title: "2. Description du service", content: "Postly est une plateforme SaaS permettant la planification, la publication et l'analyse de contenu sur les réseaux sociaux. Nous nous réservons le droit de modifier, suspendre ou interrompre tout aspect du service à tout moment." },
          { title: "3. Compte utilisateur", content: "Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités réalisées sous votre compte. Vous devez nous notifier immédiatement de tout accès non autorisé." },
          { title: "4. Utilisation acceptable", content: "Vous acceptez de ne pas utiliser Postly à des fins illégales, pour diffuser du contenu offensant, ou pour violer les conditions d'utilisation des plateformes sociales tierces intégrées." },
          { title: "5. Facturation et remboursements", content: "Les abonnements sont facturés à l'avance. Les annulations prennent effet à la fin de la période de facturation en cours. Nous ne proposons pas de remboursements partiels." },
          { title: "6. Contact", content: "Pour toute question relative à ces conditions, contactez-nous à : contact@postly.app" },
        ].map(({ title, content }) => (
          <div key={title} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 10 }}>{title}</h2>
            <p style={{ color: "#9B99B5", lineHeight: 1.7, fontSize: "0.9rem" }}>{content}</p>
          </div>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/" style={{ color: "#9B82FD", fontWeight: 600, fontSize: "0.9rem" }}>← Retour à l&apos;accueil</Link>
        </div>
      </div>
    </div>
  );
}
