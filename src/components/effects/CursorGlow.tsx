"use client"

import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"
import { useEffect } from "react"

/**
 * Halo radial qui suit le curseur (desktop only).
 * Mix-blend screen pour s'additionner aux lumières du fond.
 * Léger lag via useSpring → effet "fluide" pas "robotique".
 */
export default function CursorGlow() {
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(-1000)
  const y = useMotionValue(-1000)

  const sx = useSpring(x, { stiffness: 180, damping: 24, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 180, damping: 24, mass: 0.5 })

  useEffect(() => {
    if (reduceMotion) return
    if (typeof window === "undefined") return
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (!fine) return

    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const leave = () => {
      x.set(-1000)
      y.set(-1000)
    }
    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("pointerleave", leave)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerleave", leave)
    }
  }, [reduceMotion, x, y])

  if (reduceMotion) return null

  return (
    <motion.div
      aria-hidden="true"
      className="cursor-glow-layer"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: 520,
        height: 520,
        position: "fixed",
        top: 0,
        left: 0,
        background:
          "radial-gradient(circle, rgba(124,92,252,0.16) 0%, rgba(99,102,241,0.08) 30%, transparent 60%)",
        borderRadius: "50%",
        filter: "blur(40px)",
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 50,
      }}
    />
  )
}
