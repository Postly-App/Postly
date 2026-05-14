"use client"

import { useEffect, useRef, useMemo } from "react"

/**
 * Vue aérienne nocturne cinématique — 100% CSS/SVG, pas de Three.js.
 *
 * Stratégie pour un rendu "real-life" :
 *  - Couches de luminosité avec atmospheric perspective
 *  - Clusters denses (downtown) + zones éparses (banlieue)
 *  - Twinkle CSS animation aléatoire (60fps, GPU-only)
 *  - Avenues diagonales (lignes lumineuses fines)
 *  - Brume / fog overlay
 *  - Parallax léger au scroll (transform translateY)
 *
 * Pour remplacer par une vraie photo plus tard : poser un .jpg dans /public
 * et basculer le composant sur une <Image fill priority />.
 */

interface Light {
  x: number          // %
  y: number          // %
  size: number       // px (1–3)
  brightness: number // 0.3–1
  twinkleDelay: number
  twinkleDuration: number
  hue: number        // 30 = chaud (lampadaire) / 200 = froid (bureau / signal)
}

function genLights(count: number, seed = 1): Light[] {
  // PRNG déterministe pour SSR/CSR cohérence
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const lights: Light[] = []

  // 3 zones denses (downtown) + diffusion partout
  const hotspots = [
    { cx: 30, cy: 35, r: 18, density: 0.45 },
    { cx: 65, cy: 55, r: 22, density: 0.55 },
    { cx: 78, cy: 22, r: 14, density: 0.30 },
  ]

  // ~70% des points dans/autour des hotspots, 30% diffus
  const hotCount = Math.floor(count * 0.7)
  const diffCount = count - hotCount

  for (let i = 0; i < hotCount; i++) {
    const hs = hotspots[i % hotspots.length]
    const angle = rand() * Math.PI * 2
    const dist = Math.pow(rand(), 1.6) * hs.r
    const x = hs.cx + Math.cos(angle) * dist
    const y = hs.cy + Math.sin(angle) * dist
    if (x < 0 || x > 100 || y < 0 || y > 100) continue
    lights.push({
      x,
      y,
      size: rand() < 0.85 ? 1 : rand() < 0.7 ? 2 : 3,
      brightness: 0.45 + rand() * 0.55,
      twinkleDelay: rand() * 8,
      twinkleDuration: 3 + rand() * 6,
      hue: rand() < 0.7 ? 28 + rand() * 12 : 195 + rand() * 30, // warm streetlights + cool office windows
    })
  }
  for (let i = 0; i < diffCount; i++) {
    lights.push({
      x: rand() * 100,
      y: rand() * 100,
      size: rand() < 0.9 ? 1 : 2,
      brightness: 0.25 + rand() * 0.5,
      twinkleDelay: rand() * 8,
      twinkleDuration: 4 + rand() * 6,
      hue: rand() < 0.7 ? 30 + rand() * 10 : 200 + rand() * 20,
    })
  }
  return lights
}

export default function AerialCity({ density = "high" }: { density?: "low" | "medium" | "high" }) {
  const ref = useRef<HTMLDivElement>(null)

  const count = density === "low" ? 90 : density === "medium" ? 180 : 280
  const lights = useMemo(() => genLights(count, 42), [count])

  // Parallax léger au scroll
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        el.style.transform = `translate3d(0, ${y * 0.08}px, 0)`
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background:
          // Atmospheric perspective : presque noir au centre, indigo cosmique sur les bords
          "radial-gradient(ellipse 90% 70% at 50% 35%, #0A0F1F 0%, #060912 45%, #03050B 75%, #020308 100%)",
      }}
    >
      {/* Vignette froide bleue subtile */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(99,102,241,0.06) 0%, transparent 60%)," +
            "radial-gradient(ellipse 60% 40% at 30% 80%, rgba(6,182,212,0.04) 0%, transparent 70%)",
          mixBlendMode: "screen" as const,
        }}
      />

      {/* Couche lumières — parallax */}
      <div ref={ref} style={{ position: "absolute", inset: 0, willChange: "transform" }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {/* Avenues diagonales — lignes très fines, faible opacité */}
          <g stroke="rgba(255,200,140,0.04)" strokeWidth="0.08" fill="none">
            <line x1="0" y1="20" x2="100" y2="35" />
            <line x1="0" y1="55" x2="100" y2="68" />
            <line x1="0" y1="85" x2="100" y2="78" />
            <line x1="15" y1="0" x2="22" y2="100" />
            <line x1="68" y1="0" x2="60" y2="100" />
            <line x1="92" y1="0" x2="88" y2="100" />
          </g>

          {/* Lumières */}
          {lights.map((l, i) => {
            const color = `hsla(${l.hue}, 92%, ${55 + (l.size - 1) * 8}%, ${l.brightness})`
            const halo = `hsla(${l.hue}, 95%, 65%, ${l.brightness * 0.35})`
            return (
              <g key={i}>
                {/* Halo */}
                <circle
                  cx={l.x}
                  cy={l.y}
                  r={l.size * 0.45}
                  fill={halo}
                  style={{
                    filter: "blur(0.3px)",
                    animation: `twinkle ${l.twinkleDuration}s ease-in-out ${l.twinkleDelay}s infinite alternate`,
                  }}
                />
                {/* Core */}
                <circle
                  cx={l.x}
                  cy={l.y}
                  r={l.size * 0.12}
                  fill={color}
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Brume basse pour donner de la profondeur atmosphérique */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 0%, transparent 55%, rgba(8,12,24,0.4) 80%, rgba(3,5,11,0.92) 100%)",
        }}
      />

      {/* Hot spot lumineux haut (lune / source lumineuse hors champ) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-10%",
          left: "60%",
          width: "60vmax",
          height: "60vmax",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 50%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
