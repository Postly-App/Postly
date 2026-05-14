"use client"

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"
import { Rocket, Zap, Clock, ShieldCheck } from "lucide-react"
import { useEffect, useRef } from "react"
import { EASE } from "@/lib/motion"

interface Stat {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  label: string
  tint: string
  border: string
}

const STATS: Stat[] = [
  { Icon: Rocket,      value: 25,   prefix: "+", suffix: "%",                label: "Engagement moyen",   tint: "rgba(99,102,241,0.14)",  border: "rgba(99,102,241,0.28)" },
  { Icon: Zap,         value: 10,                suffix: "x",                label: "Publication plus rapide", tint: "rgba(192,132,252,0.14)", border: "rgba(192,132,252,0.28)" },
  { Icon: Clock,       value: 14,                suffix: " h/sem",           label: "De temps économisé", tint: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.28)" },
  { Icon: ShieldCheck, value: 99.9,              suffix: "%", decimals: 1,   label: "Uptime garanti",     tint: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.28)" },
]

function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const motionVal = useMotionValue(0)
  const display = useTransform(motionVal, (latest) => {
    const formatted = latest.toFixed(decimals)
    const n = Number(formatted)
    // 1000 → "2,500" style
    if (n >= 1000 && decimals === 0) {
      return prefix + n.toLocaleString("fr-FR") + suffix
    }
    return prefix + formatted.replace(".", ",") + suffix
  })

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionVal, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
    })
    return () => controls.stop()
  }, [inView, motionVal, value])

  return <motion.span ref={ref}>{display}</motion.span>
}

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
        {STATS.map((s, i) => (
          <div
            key={s.label}
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
                background: s.tint,
                border: `1px solid ${s.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset",
              }}
            >
              <s.Icon size={17} strokeWidth={1.75} color="var(--text-1)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "var(--text-1)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  fontFamily: "var(--font-sans)",
                }}
              >
                <AnimatedNumber
                  value={s.value}
                  decimals={s.decimals ?? 0}
                  prefix={s.prefix}
                  suffix={s.suffix}
                />
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-3)",
                  marginTop: 2,
                  letterSpacing: "-0.005em",
                }}
              >
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
