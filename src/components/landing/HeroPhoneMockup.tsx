"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Sparkles, Calendar, ChevronLeft, ImageIcon, Hash, Check } from "lucide-react"
import { EASE } from "@/lib/motion"

/**
 * Mockup iPhone — affiche un vrai écran composer Postly (mock du produit, pas
 * de la landing). Pure CSS/SVG, aucune image externe.
 *
 * Interactif : tilt 3D au mouvement de souris. Désactivé pour les utilisateurs
 * `prefers-reduced-motion` (Framer Motion gère ça automatiquement via le
 * `MotionConfig` global si défini, sinon le spring reste subtil).
 */
export default function HeroPhoneMockup() {
  const wrapRef = useRef<HTMLDivElement>(null)

  // Mouse-driven rotation values. Spring smoothes the response.
  const rotateX = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 })

  // Light shimmer offset based on tilt, so glare follows mouse subtly.
  const shimmerX = useTransform(rotateY, [-12, 12], ["30%", "70%"])
  const shimmerY = useTransform(rotateX, [-12, 12], ["70%", "30%"])

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width // 0..1
    const y = (e.clientY - rect.top) / rect.height // 0..1
    // Max ~12deg tilt, inverted for natural feel
    rotateY.set((x - 0.5) * 24)
    rotateX.set(-(y - 0.5) * 18)
  }

  const handleLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, delay: 0.3, ease: EASE.outExpo }}
      style={{
        width: 280,
        height: 580,
        flexShrink: 0,
        position: "relative",
        perspective: 1200,
        cursor: "grab",
      }}
    >
      {/* Couche float verticale (subtile) */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
        style={{ width: "100%", height: "100%", position: "relative" }}
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

        {/* Frame du phone — tilt 3D appliqué ici */}
        <motion.div
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
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Reflet/glare qui suit le tilt */}
          <motion.div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 42,
              background: useTransform(
                [shimmerX, shimmerY],
                ([x, y]) =>
                  `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.08), transparent 45%)`
              ),
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />

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

            {/* Platform pills — VRAIS logos */}
            <div style={{ padding: "0 16px 12px", display: "flex", gap: 6 }}>
              <PlatformPill brand="instagram" selected />
              <PlatformPill brand="tiktok" selected />
              <PlatformPill brand="linkedin" selected />
              <PlatformPill brand="x" selected />
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
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/* ─── pills + thumbnails ─── */
type BrandKey = "instagram" | "tiktok" | "linkedin" | "x"

const BRAND_META: Record<BrandKey, { label: string; color: string; bg: string }> = {
  instagram: { label: "Instagram", color: "#F472B6", bg: "rgba(244,114,182,0.10)" },
  tiktok:    { label: "TikTok",    color: "#67E8F9", bg: "rgba(103,232,249,0.10)" },
  linkedin:  { label: "LinkedIn",  color: "#60A5FA", bg: "rgba(96,165,250,0.10)" },
  x:         { label: "X",         color: "#E5E7EB", bg: "rgba(229,231,235,0.06)" },
}

function PlatformPill({ brand, selected }: { brand: BrandKey; selected?: boolean }) {
  const meta = BRAND_META[brand]
  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: 30,
      borderRadius: 8,
      background: selected ? meta.bg : "rgba(255,255,255,0.03)",
      border: `1px solid ${selected ? meta.color + "55" : "var(--line-2)"}`,
      color: selected ? meta.color : "var(--text-3)",
      position: "relative",
    }}>
      <BrandIcon brand={brand} color={selected ? meta.color : "currentColor"} />
      {selected && (
        <span style={{
          position: "absolute",
          top: -3,
          right: -3,
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: meta.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 8px ${meta.color}88`,
        }}>
          <Check size={7} strokeWidth={3} color="#06070B" />
        </span>
      )}
    </div>
  )
}

function BrandIcon({ brand, color }: { brand: BrandKey; color: string }) {
  if (brand === "instagram") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="Instagram">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke={color} strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.6" />
        <circle cx="17.5" cy="6.5" r="1.1" fill={color} />
      </svg>
    )
  }
  if (brand === "tiktok") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color} aria-label="TikTok">
        <path d="M16.5 3h2.4c.4 1.95 1.55 3.18 3.6 3.55v2.45c-1.5 0-2.85-.42-4-1.2v5.85c0 3.65-2.9 6.6-6.5 6.6S5.5 17.3 5.5 13.65c0-3.5 2.7-6.35 6.1-6.55v2.55c-2 .2-3.55 1.85-3.55 3.95 0 2.25 1.8 4.05 4 4.05s4-1.8 4-4.05V3Z"/>
      </svg>
    )
  }
  if (brand === "linkedin") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color} aria-label="LinkedIn">
        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.25 8h4.5v14H.25V8Zm7 0h4.32v1.92h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9V22h-4.5v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V22H7.25V8Z"/>
      </svg>
    )
  }
  // X / Twitter
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={color} aria-label="X">
      <path d="M18.244 2H21.5l-7.49 8.56L23 22h-6.84l-5.36-7-6.13 7H1.41l8.01-9.16L1 2h7.01l4.85 6.4L18.244 2Zm-1.2 18h1.86L7.04 4H5.04l12 16Z"/>
    </svg>
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
