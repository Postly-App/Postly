"use client"

import { motion } from "framer-motion"
import { Rocket, Zap } from "lucide-react"
import { EASE } from "@/lib/motion"

/**
 * Mockup iPhone — purement CSS/SVG, pas d'image.
 * Représente la même landing sur mobile = preuve que Postly est responsive.
 */
export default function HeroPhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 1.1, delay: 0.3, ease: EASE.outExpo }}
      style={{
        width: 280,
        height: 580,
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Floating animation subtile */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {/* Halo derrière le phone */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -40,
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(99,102,241,0.25), transparent 60%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />

        {/* Frame du phone */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 42,
            background: "linear-gradient(180deg, #1a1d2b 0%, #0c0e16 100%)",
            padding: 8,
            boxShadow:
              "0 0 0 1.5px rgba(255,255,255,0.10), " +
              "0 30px 60px -15px rgba(0,0,0,0.7), " +
              "0 0 80px -20px rgba(99,102,241,0.5)",
          }}
        >
          {/* Écran */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: 34,
              overflow: "hidden",
              background:
                "linear-gradient(180deg, rgba(11,13,20,1) 0%, rgba(14,16,24,1) 100%)",
            }}
          >
            {/* Status bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 22px 6px",
              fontSize: "0.7rem",
              color: "var(--text-1)",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
            }}>
              <span>9:41</span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <SignalIcon />
                <WifiIcon />
                <BatteryIcon />
              </div>
            </div>

            {/* Dynamic island */}
            <div style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 90,
              height: 26,
              borderRadius: 14,
              background: "#000",
            }} />

            {/* Mini nav */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 18px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PostlyLogo size={20} />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
                  Postly
                </span>
              </div>
              <div style={{
                width: 22, height: 18,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div style={{ width: "100%", height: 1.5, background: "var(--text-1)", borderRadius: 1 }} />
                <div style={{ width: "100%", height: 1.5, background: "var(--text-1)", borderRadius: 1 }} />
                <div style={{ width: "100%", height: 1.5, background: "var(--text-1)", borderRadius: 1 }} />
              </div>
            </div>

            {/* Badge */}
            <div style={{ padding: "0 18px", marginBottom: 14 }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 8px",
                borderRadius: 99,
                background: "rgba(99,102,241,0.14)",
                border: "1px solid rgba(99,102,241,0.30)",
                fontSize: "0.55rem",
                fontWeight: 600,
                color: "#A5B4FC",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>
                <span style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "#34D399",
                  boxShadow: "0 0 6px #34D399",
                }} />
                La plateforme n°1
              </div>
            </div>

            {/* Titre */}
            <div style={{ padding: "0 18px", marginBottom: 10 }}>
              <h2 style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "var(--text-1)",
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                marginBottom: 4,
              }}>
                Publiez. Analysez.
              </h2>
              <h2 style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                background: "linear-gradient(135deg, #818CF8 0%, #C084FC 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}>
                Développez.
              </h2>
            </div>

            {/* Subtitle */}
            <p style={{
              padding: "0 18px",
              fontSize: "0.62rem",
              color: "var(--text-3)",
              lineHeight: 1.5,
              marginBottom: 14,
            }}>
              Gérez tous vos réseaux sociaux depuis une seule plateforme. Gagnez du temps, créez du contenu incroyable.
            </p>

            {/* CTAs */}
            <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
              <button style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
                color: "#fff",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "-0.005em",
                boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}>
                Commencer gratuitement
              </button>
              <button style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 9,
                border: "1px solid var(--line-2)",
                background: "rgba(180,200,255,0.04)",
                color: "var(--text-2)",
                fontSize: "0.65rem",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}>
                Voir une démo
              </button>
            </div>

            {/* Mini stats card */}
            <div style={{
              margin: "0 14px",
              padding: 10,
              background: "var(--surface-3)",
              border: "1px solid var(--line-2)",
              borderRadius: 12,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: "rgba(99,102,241,0.16)",
                border: "1px solid rgba(99,102,241,0.30)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Rocket size={12} strokeWidth={1.75} color="#A5B4FC" />
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-1)" }}>+25%</div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-3)" }}>Engagement moyen</div>
              </div>
            </div>
            <div style={{
              margin: "0 14px",
              padding: 10,
              background: "var(--surface-3)",
              border: "1px solid var(--line-2)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: "rgba(6,182,212,0.16)",
                border: "1px solid rgba(6,182,212,0.30)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={12} strokeWidth={1.75} color="#67E8F9" />
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-1)" }}>10x</div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-3)" }}>Plus rapide</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── icônes SVG mini ─── */
function SignalIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 18 12" fill="none">
      <rect x="0" y="8" width="3" height="4" rx="0.5" fill="currentColor" />
      <rect x="5" y="5" width="3" height="7" rx="0.5" fill="currentColor" />
      <rect x="10" y="2" width="3" height="10" rx="0.5" fill="currentColor" />
      <rect x="15" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
    </svg>
  )
}
function WifiIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M1 4 Q8 -1 15 4" />
      <path d="M3.5 6.5 Q8 3 12.5 6.5" />
      <circle cx="8" cy="9.5" r="1" fill="currentColor" />
    </svg>
  )
}
function BatteryIcon() {
  return (
    <svg width="22" height="10" viewBox="0 0 24 10" fill="none">
      <rect x="0.5" y="0.5" width="20" height="9" rx="2" stroke="currentColor" strokeWidth="0.8" />
      <rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor" />
      <rect x="21" y="3" width="1.5" height="4" rx="0.5" fill="currentColor" />
    </svg>
  )
}
function PostlyLogo({ size = 22 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 7,
      background: "linear-gradient(135deg, #6366F1, #4F46E5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 12px rgba(99,102,241,0.5)",
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="9" strokeOpacity="0.5" />
      </svg>
    </div>
  )
}

