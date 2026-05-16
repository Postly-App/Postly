"use client"

import { motion } from "framer-motion"
import { Sparkles, Calendar, ChevronLeft, ImageIcon, Hash, Check } from "lucide-react"
import { EASE } from "@/lib/motion"

/**
 * Mockup iPhone — affiche un vrai écran composer Postly (mock du produit, pas
 * de la landing). Tout est rendu en pur CSS/SVG, aucune image externe.
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

            {/* Header : back arrow + title + save */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 16px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ChevronLeft size={16} strokeWidth={2.2} color="var(--text-2)" />
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)" }}>Retour</span>
              </div>
              <span style={{
                fontSize: "0.74rem",
                fontWeight: 600,
                color: "#A5B4FC",
                padding: "3px 9px",
                background: "rgba(99,102,241,0.14)",
                border: "1px solid rgba(99,102,241,0.28)",
                borderRadius: 8,
              }}>Brouillon</span>
            </div>

            {/* Title section */}
            <div style={{ padding: "0 16px 14px" }}>
              <div style={{
                fontSize: "0.62rem",
                fontWeight: 600,
                color: "var(--text-3)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 5,
              }}>
                Nouveau post
              </div>
              <h3 style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text-1)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}>
                Publier sur 4 réseaux
              </h3>
            </div>

            {/* Platform pills */}
            <div style={{ padding: "0 16px 12px", display: "flex", gap: 6 }}>
              <PlatformPill label="IG" color="#F472B6" selected />
              <PlatformPill label="TT" color="#67E8F9" selected />
              <PlatformPill label="LI" color="#60A5FA" selected />
              <PlatformPill label="X" color="#94A3B8" selected />
            </div>

            {/* Composer textarea */}
            <div style={{
              margin: "0 16px 10px",
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--line-2)",
              minHeight: 78,
              position: "relative",
            }}>
              <div style={{
                fontSize: "0.62rem",
                color: "var(--text-1)",
                lineHeight: 1.5,
                fontFamily: "var(--font-sans)",
              }}>
                Lancement de notre collection automne — pièces en lin
                local, livraison offerte cette semaine.
              </div>
              <div style={{
                marginTop: 6,
                fontSize: "0.6rem",
                color: "#A5B4FC",
                lineHeight: 1.4,
              }}>
                #automne #modeFR #fabriquéenfrance
              </div>
              {/* Caret blink */}
              <motion.span
                aria-hidden="true"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  width: 1.5,
                  height: 9,
                  background: "#818CF8",
                  borderRadius: 1,
                }}
              />
            </div>

            {/* AI suggestion */}
            <div style={{
              margin: "0 16px 10px",
              padding: "8px 10px",
              borderRadius: 9,
              background: "linear-gradient(135deg, rgba(124,92,252,0.14), rgba(192,132,252,0.08))",
              border: "1px solid rgba(192,132,252,0.30)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <Sparkles size={11} strokeWidth={1.75} color="#C4B5FD" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.3 }}>
                  Suggestion IA
                </div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-3)", lineHeight: 1.3, marginTop: 1 }}>
                  Renforce l&apos;accroche par une question ?
                </div>
              </div>
              <span style={{
                fontSize: "0.55rem", fontWeight: 600,
                color: "#C4B5FD",
                padding: "2px 6px",
                background: "rgba(192,132,252,0.14)",
                borderRadius: 6,
              }}>Appliquer</span>
            </div>

            {/* Media row */}
            <div style={{ padding: "0 16px 10px", display: "flex", gap: 6 }}>
              <MediaThumb gradient="linear-gradient(135deg, #FB923C 0%, #F472B6 100%)" />
              <MediaThumb gradient="linear-gradient(135deg, #818CF8 0%, #67E8F9 100%)" />
              <div style={{
                width: 48, height: 48, borderRadius: 8,
                border: "1px dashed var(--line-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-3)",
              }}>
                <ImageIcon size={14} strokeWidth={1.5} />
              </div>
            </div>

            {/* Hashtag chip + count */}
            <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 7px",
                background: "rgba(34,211,238,0.12)",
                border: "1px solid rgba(34,211,238,0.28)",
                borderRadius: 99,
                fontSize: "0.55rem", fontWeight: 600,
                color: "#67E8F9",
              }}>
                <Hash size={9} strokeWidth={2} />
                12 suggérés
              </div>
              <span style={{ fontSize: "0.55rem", color: "var(--text-3)", marginLeft: "auto" }}>
                148 / 280
              </span>
            </div>

            {/* Schedule + CTA */}
            <div style={{
              position: "absolute",
              bottom: 14,
              left: 14,
              right: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--line-2)",
                borderRadius: 9,
              }}>
                <Calendar size={11} strokeWidth={1.75} color="var(--text-2)" />
                <div style={{ flex: 1, fontSize: "0.6rem", color: "var(--text-2)" }}>
                  Jeudi 16 mai · 14:30
                </div>
                <span style={{
                  fontSize: "0.55rem", fontWeight: 600,
                  color: "#A5B4FC",
                }}>Modifier</span>
              </div>

              <button style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
                color: "#fff",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "-0.005em",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.18) inset, " +
                  "0 8px 22px -6px rgba(79,70,229,0.55)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}>
                Programmer la publication
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── pills + thumbnails ─── */
function PlatformPill({ label, color, selected }: { label: string; color: string; selected?: boolean }) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      height: 26,
      borderRadius: 8,
      background: selected ? `${color}1A` : "rgba(255,255,255,0.03)",
      border: `1px solid ${selected ? color + "55" : "var(--line-2)"}`,
      color: selected ? color : "var(--text-3)",
      fontSize: "0.6rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      position: "relative",
    }}>
      {label}
      {selected && (
        <span style={{
          position: "absolute",
          top: -3,
          right: -3,
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 8px ${color}88`,
        }}>
          <Check size={7} strokeWidth={3} color="#06070B" />
        </span>
      )}
    </div>
  )
}

function MediaThumb({ gradient }: { gradient: string }) {
  return (
    <div style={{
      width: 48,
      height: 48,
      borderRadius: 8,
      background: gradient,
      boxShadow: "0 4px 12px -2px rgba(0,0,0,0.5)",
      position: "relative",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
      }} />
    </div>
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
