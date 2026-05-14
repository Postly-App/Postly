"use client"

import Link from "next/link"
import { CheckCircle2, Sparkles, Users, BarChart3, Bot, Infinity as InfinityIcon, Key, FileBarChart } from "lucide-react"

type Plan = "PRO" | "AGENCY"

interface Feature {
  icon: React.ReactNode
  title: string
  desc: string
}

const PRO_FEATURES: Feature[] = [
  {
    icon: <Users size={22} color="#9B82FD" />,
    title: "15 comptes sociaux",
    desc: "Connecte jusqu'à 15 réseaux (vs 3 en gratuit).",
  },
  {
    icon: <InfinityIcon size={22} color="#9B82FD" />,
    title: "Posts illimités",
    desc: "Plus de quota mensuel : planifie autant que tu veux.",
  },
  {
    icon: <Bot size={22} color="#9B82FD" />,
    title: "Assistant IA complet",
    desc: "Génère des idées, rédige et améliore tes posts.",
  },
  {
    icon: <BarChart3 size={22} color="#9B82FD" />,
    title: "Analytics avancés",
    desc: "Graphiques détaillés, comparaisons et export.",
  },
]

const AGENCY_FEATURES: Feature[] = [
  {
    icon: <InfinityIcon size={22} color="#22D3A0" />,
    title: "Comptes sociaux illimités",
    desc: "Plus aucune limite, idéal pour gérer plusieurs marques.",
  },
  {
    icon: <Users size={22} color="#22D3A0" />,
    title: "Gestion multi-clients & équipe",
    desc: "Invite jusqu'à 5 membres et gère plusieurs clients.",
  },
  {
    icon: <Key size={22} color="#22D3A0" />,
    title: "API complète",
    desc: "Génère des clés et intègre Postly à tes outils.",
  },
  {
    icon: <FileBarChart size={22} color="#22D3A0" />,
    title: "Rapports en marque blanche",
    desc: "Exporte des rapports PDF aux couleurs de tes clients.",
  },
]

export default function SuccessClient({ plan, userName }: { plan: Plan; userName: string | null }) {
  const isAgency = plan === "AGENCY"
  const features = isAgency ? AGENCY_FEATURES : PRO_FEATURES
  const accent = isAgency ? "#22D3A0" : "#7C5CFC"
  const accentHover = isAgency ? "#1FB089" : "#9B82FD"

  return (
    <div style={{
      minHeight: "100vh",
      padding: "60px 24px 80px",
      maxWidth: 920,
      marginLeft: "auto",
      marginRight: "auto",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        marginBottom: 40,
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${accent}, ${accentHover})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 32px ${accent}55`,
          marginBottom: 24,
        }}>
          <CheckCircle2 size={36} color="#fff" strokeWidth={2.5} />
        </div>

        <h1 style={{
          fontSize: "2rem",
          fontWeight: 800,
          letterSpacing: "-0.5px",
          marginBottom: 12,
        }}>
          Bienvenue sur Postly {isAgency ? "Agence" : "Pro"}{userName ? `, ${userName.split(" ")[0]}` : ""} !
        </h1>

        <p style={{
          color: "var(--clr-muted)",
          fontSize: "1rem",
          maxWidth: 540,
          lineHeight: 1.6,
        }}>
          {isAgency
            ? "Ton abonnement Agence est actif. Tu as maintenant accès à toutes les fonctionnalités pour gérer plusieurs clients et ton équipe."
            : "Ton abonnement Pro est actif. 7 jours d'essai gratuit avant le premier prélèvement — tu peux annuler à tout moment depuis ton espace facturation."}
        </p>
      </div>

      <div style={{
        background: "var(--clr-card)",
        border: "1px solid var(--clr-border)",
        borderRadius: 20,
        padding: 32,
        marginBottom: 32,
      }}>
        <h2 style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <Sparkles size={20} color={accent} />
          Ce que tu débloques maintenant
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "var(--clr-bg)",
              border: "1px solid var(--clr-border)",
              borderRadius: 14,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${accent}1A`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{f.title}</h3>
              <p style={{ color: "var(--clr-muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: "flex",
        gap: 12,
        justifyContent: "center",
        flexWrap: "wrap",
      }}>
        <Link
          href="/compose"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accentHover})`,
            color: "#fff",
            padding: "14px 28px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: "0.95rem",
            textDecoration: "none",
            boxShadow: `0 0 24px ${accent}44`,
          }}
        >
          Créer mon premier post →
        </Link>
        <Link
          href="/billing"
          style={{
            background: "transparent",
            color: "var(--clr-text)",
            padding: "14px 28px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: "0.95rem",
            textDecoration: "none",
            border: "1px solid var(--clr-border)",
          }}
        >
          Voir mon abonnement
        </Link>
      </div>

      <div style={{
        marginTop: 40,
        padding: 20,
        background: "var(--clr-card)",
        border: "1px solid var(--clr-border)",
        borderRadius: 14,
        textAlign: "center",
      }}>
        <p style={{ fontSize: "0.85rem", color: "var(--clr-muted)", margin: 0 }}>
          💡 <strong style={{ color: "var(--clr-text)" }}>Étape suivante recommandée :</strong>{" "}
          <Link href="/settings?tab=Comptes" style={{ color: accent, fontWeight: 600 }}>
            connecte ton premier compte social
          </Link>{" "}
          pour publier en moins de 2 minutes.
        </p>
      </div>
    </div>
  )
}
