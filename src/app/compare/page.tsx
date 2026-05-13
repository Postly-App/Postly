"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import TiltCard from "@/components/cinematic/TiltCard";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ComparePage() {
  const rows = [
    { label: "Modèle tarifaire", postly: "Gratuit / Pro / Agence (à partir de 29 €/mois)", buffer: "Essai puis plans payants", hootsuite: "Plans entreprise", later: "Abonnement mensuel", sprout: "Premium / entreprise" },
    { label: "Réseaux supportés (objectif produit)", postly: "Instagram, Facebook, X, LinkedIn, YouTube, TikTok, Threads, Pinterest…", buffer: "Multi-plateformes", hootsuite: "Large catalogue", later: "Visuel-first (IG, FB, TikTok…)", sprout: "Large + social care" },
    { label: "Planification", postly: "Calendrier + file d’attente", buffer: "Oui", hootsuite: "Oui", later: "Oui", sprout: "Oui" },
    { label: "IA intégrée (assistant)", postly: "Assistant contenu (objectif produit)", buffer: "IA limitée selon plan", hootsuite: "IA / automatisations", later: "Suggestions", sprout: "IA avancée" },
    { label: "Analytics", postly: "Tableaux de bord par post / période", buffer: "Rapports", hootsuite: "Analytics poussés", later: "Métriques visuelles", sprout: "Très complet" },
    { label: "Public cible", postly: "Créateurs & PME francophones", buffer: "PME / équipes", hootsuite: "Grandes équipes", later: "Créateurs visuels", sprout: "Marques / support client" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)", fontFamily: "var(--font)" }}>
      <header style={{
        padding: "20px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Link href="/" style={{ fontWeight: 800, color: "var(--clr-primary-h)", textDecoration: "none" }}>← Postly</Link>
        <Link href="/signup" style={{
          padding: "8px 18px",
          borderRadius: 12,
          background: "var(--clr-primary)",
          color: "#fff",
          fontWeight: 600,
          fontSize: "0.85rem",
          textDecoration: "none",
        }}>Créer un compte</Link>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800, marginBottom: 12 }}>
          Postly et les autres outils
        </h1>
        <p style={{ color: "var(--clr-muted)", maxWidth: 720, lineHeight: 1.7, marginBottom: 8 }}>
          Ce tableau synthétise des <strong>familles de fonctionnalités</strong> courantes sur le marché (sans prix temps réel des concurrents : ils évoluent).
          Les offres exactes dépendent des plans et des périodes de facturation chez chaque éditeur.
        </p>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.85rem", marginBottom: 40 }}>
          Sources types : sites officiels Buffer, Hootsuite, Later, Sprout Social (pages « Pricing » / « Features »), consultées pour structurer les colonnes — vérifier les tarifs avant décision d’achat.
        </p>

        <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720, fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "rgba(17,17,24,0.95)" }}>
                {["Critère", "Postly", "Buffer", "Hootsuite", "Later", "Sprout Social"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    fontWeight: 700,
                    color: h === "Postly" ? "var(--clr-primary-h)" : "var(--clr-muted)",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} style={{ background: "rgba(10,10,15,0.5)" }}>
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 600 }}>{r.label}</td>
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--clr-text)", maxWidth: 220 }}>{r.postly}</td>
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--clr-muted)", maxWidth: 200 }}>{r.buffer}</td>
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--clr-muted)", maxWidth: 200 }}>{r.hootsuite}</td>
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--clr-muted)", maxWidth: 200 }}>{r.later}</td>
                  <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--clr-muted)", maxWidth: 200 }}>{r.sprout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{ marginTop: 56 }}
        >
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: 20 }}>Pourquoi choisir Postly ?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {[
              "Interface centrée sur la publication et le calendrier, sans surcouche « enterprise » imposée aux petites équipes.",
              "Positionnement francophone : copy, messages d’erreur et documentation alignés sur le marché FR/EU.",
              "Tarification lisible (Gratuit / Pro / Agence) avec essai possible sur le plan gratuit.",
              "Feuille de route orientée productivité : IA d’aide à la rédaction, analytics par post, intégrations réseaux.",
            ].map((text) => (
              <TiltCard key={text} intensity={3} style={{
                padding: 22,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(17,17,24,0.65)",
                color: "var(--clr-muted)",
                lineHeight: 1.65,
                fontSize: "0.92rem",
              }}>
                {text}
              </TiltCard>
            ))}
          </div>
        </motion.section>

        <p style={{ marginTop: 40, color: "var(--clr-muted)", fontSize: "0.85rem" }}>
          Aucun témoignage inventé sur cette page. Pour un avis utilisateur, préférez une preuve vérifiable (étude de cas, citation nommée avec accord, avis tiers).
        </p>
      </main>
    </div>
  );
}
