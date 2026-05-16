"use client"

import { motion } from "framer-motion"
import { CalendarClock, Sparkles, LineChart, ShieldCheck } from "lucide-react"
import { EASE } from "@/lib/motion"

interface Highlight {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  title: string
  sub: string
  tint: string
  border: string
}

const HIGHLIGHTS: Highlight[] = [
  { Icon: CalendarClock, title: "Multi-réseaux",     sub: "7 plateformes supportées",  tint: "rgba(99,102,241,0.14)",  border: "rgba(99,102,241,0.28)" },
  { Icon: Sparkles,      title: "Assistant IA",      sub: "Légendes & hashtags",       tint: "rgba(192,132,252,0.14)", border: "rgba(192,132,252,0.28)" },
  { Icon: LineChart,     title: "Analytics",         sub: "Dashboard unifié",          tint: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.28)" },
  { Icon: ShieldCheck,   title: "Hébergé en Europe", sub: "Conforme RGPD",             tint: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.28)" },
]

export default function HeroStatsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: EASE.outExpo }}
      style={{
        position: "relative",
        zIndex: 4,
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 0,
          padding: "20px 24px",
          background: "linear-gradient(180deg, rgba(14,16,24,0.85), rgba(11,13,20,0.92))",
          border: "1px solid var(--line-2)",
          borderRadius: 20,
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.06) inset, " +
            "0 24px 48px -16px rgba(0,0,0,0.6), " +
            "0 0 0 1px rgba(99,102,241,0.05)",
        }}
      >
        {HIGHLIGHTS.map((h, i) => (
          <div
            key={h.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "8px 16px",
              borderLeft: i > 0 ? "1px solid var(--line-2)" : "none",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: h.tint,
                border: `1px solid ${h.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset",
              }}
            >
              <h.Icon size={17} strokeWidth={1.75} color="var(--text-1)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--text-1)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {h.title}
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-3)",
                  marginTop: 2,
                  letterSpacing: "-0.005em",
                }}
              >
                {h.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
