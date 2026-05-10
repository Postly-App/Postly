import Link from "next/link";
import Logo from "@/components/Logo";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#F1F0FF", fontFamily: "var(--font)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <Logo size={28} />
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 }}>Politique de Confidentialité</h1>
        <p style={{ color: "#9B99B5", marginBottom: 40, fontSize: "0.9rem" }}>Dernière mise à jour : mai 2026</p>

        <div style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 12, padding: "20px 24px", marginBottom: 40 }}>
          <p style={{ color: "#9B82FD", fontSize: "0.9rem", fontWeight: 600 }}>
            🔒 Ce document est en cours de rédaction par notre équipe juridique. La version complète sera disponible avant le lancement officiel de Postly.
          </p>
        </div>

        {[
          { title: "1. Données collectées", content: "Nous collectons les informations que vous nous fournissez lors de la création de votre compte (nom, adresse email), ainsi que les données d'utilisation du service (posts, statistiques, préférences). Nous ne collectons pas de données sensibles." },
          { title: "2. Utilisation des données", content: "Vos données sont utilisées pour vous fournir le service Postly, améliorer notre plateforme, et vous envoyer des communications relatives à votre compte. Nous ne vendons jamais vos données à des tiers." },
          { title: "3. Partage des données", content: "Nous partageons vos données uniquement avec nos prestataires techniques (hébergement, paiement, authentification) dans le cadre strict de la fourniture du service. Tous nos partenaires respectent le RGPD." },
          { title: "4. Conservation des données", content: "Vos données sont conservées pendant toute la durée de votre abonnement et 30 jours après la clôture de votre compte, sauf obligation légale contraire." },
          { title: "5. Vos droits (RGPD)", content: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition concernant vos données personnelles. Pour exercer ces droits, contactez-nous à : contact@postly.app" },
          { title: "6. Cookies", content: "Postly utilise des cookies strictement nécessaires au fonctionnement du service (session, authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé." },
          { title: "7. Contact", content: "Pour toute question relative à cette politique, contactez notre DPO à : contact@postly.app" },
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
