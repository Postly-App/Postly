"use client"

import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion"
import { useRef, type ReactNode, type CSSProperties } from "react"

interface NeonTextProps {
  children: ReactNode
  variant?: "indigo" | "cyan" | "white"
  as?: "h1" | "h2" | "h3" | "span"
  className?: string
  style?: CSSProperties
  scrollChroma?: boolean
}

const VARIANTS = {
  indigo: {
    background: "linear-gradient(135deg, #fff 25%, #C4B5FD 50%, #C084FC 75%, #F472B6 100%)",
    drop: "0 0 32px rgba(192, 132, 252, 0.32)",
  },
  cyan: {
    background: "linear-gradient(135deg, #fff 25%, #67E8F9 55%, #818CF8 100%)",
    drop: "0 0 32px rgba(34, 211, 238, 0.32)",
  },
  white: {
    background: "linear-gradient(180deg, #fff 0%, #B4BCD0 100%)",
    drop: "0 0 24px rgba(255, 255, 255, 0.15)",
  },
}

export default function NeonText({
  children,
  variant = "indigo",
  as: Component = "span",
  className,
  style,
  scrollChroma = false,
}: NeonTextProps) {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const palette = VARIANTS[variant]

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const chromaR: MotionValue<number> = useTransform(scrollYProgress, [0, 0.5, 1], [-2, 0, 2])
  const chromaB: MotionValue<number> = useTransform(scrollYProgress, [0, 0.5, 1], [2, 0, -2])
  const textShadow = useTransform([chromaR, chromaB], (values) => {
    const v = values as number[]
    if (!scrollChroma || reduceMotion) return "none"
    return `${v[0]}px 0 0 rgba(244, 114, 182, 0.35), ${v[1]}px 0 0 rgba(34, 211, 238, 0.35)`
  })

  const MotionTag = motion[Component as keyof typeof motion] as typeof motion.span

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      style={{
        background: palette.background,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        filter: `drop-shadow(${palette.drop})`,
        textShadow: scrollChroma && !reduceMotion ? textShadow : undefined,
        display: "inline-block",
        ...style,
      }}
    >
      {children}
    </MotionTag>
  )
}
