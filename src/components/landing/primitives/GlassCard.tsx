"use client"

import { motion, useReducedMotion } from "framer-motion"
import { forwardRef, type CSSProperties, type ReactNode, type MouseEvent } from "react"
import { DUR, EASE } from "@/lib/motion"

interface GlassCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  neonBorder?: boolean
  accent?: "indigo" | "cyan" | "magenta" | "emerald"
  interactive?: boolean
  onClick?: () => void
  padding?: number | string
}

const ACCENT_TINTS = {
  indigo:  { hover: "rgba(99,102,241,0.32)",  glow: "rgba(99,102,241,0.3)" },
  cyan:    { hover: "rgba(34,211,238,0.32)",  glow: "rgba(34,211,238,0.3)" },
  magenta: { hover: "rgba(244,114,182,0.32)", glow: "rgba(244,114,182,0.3)" },
  emerald: { hover: "rgba(52,211,153,0.32)",  glow: "rgba(52,211,153,0.3)" },
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { children, className, style, neonBorder = false, accent = "indigo", interactive = false, onClick, padding = "32px 28px" },
  ref
) {
  const reduceMotion = useReducedMotion()
  const tint = ACCENT_TINTS[accent]

  const handlePointerMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!interactive || reduceMotion) return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`)
    el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`)
  }

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onMouseMove={handlePointerMove}
      whileHover={interactive && !reduceMotion ? { y: -3 } : undefined}
      transition={{ duration: DUR.base, ease: EASE.outQuart }}
      className={`glass-card ${neonBorder ? "glass-card-neon" : ""} ${className ?? ""}`}
      style={{
        padding,
        cursor: interactive || onClick ? "pointer" : "default",
        "--hover-ring": tint.hover,
        "--hover-glow": tint.glow,
        ...style,
      } as CSSProperties}
    >
      {/* Spotlight overlay (suit le curseur sur cards interactives) */}
      {interactive && !reduceMotion && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background: `radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), ${tint.glow.replace("0.3", "0.08")}, transparent 50%)`,
            opacity: 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
          className="glass-spotlight"
        />
      )}
      {children}
      <style jsx>{`
        :global(.glass-card:hover) .glass-spotlight { opacity: 1; }
      `}</style>
    </motion.div>
  )
})

export default GlassCard
