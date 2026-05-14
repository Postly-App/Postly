"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

/**
 * Hero background — vraie photo de ville la nuit + trainées lumineuses animées.
 *
 * Stack visuel :
 *   1. Photo Unsplash (CDN, optimisée Next/Image) — vue aérienne ville nuit
 *   2. Trails SVG animés (long-exposure feel) — gradients qui voyagent sur des courbes
 *   3. Fenêtres scintillantes (twinkle)
 *   4. Parallax léger au scroll
 *   5. Overlay gradient pour lisibilité du contenu
 */

// Tu peux remplacer cette URL par n'importe quelle photo de ville nuit.
// Unsplash CC0, gratuit, optimisé Next/Image automatiquement.
const CITY_PHOTO =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2400&q=85"

export default function CityNightHero() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        el.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(${1 + Math.min(y, 600) * 0.0002})`
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
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* ─── Couche 1 : photo de ville ─── */}
      <div
        ref={ref}
        style={{
          position: "absolute",
          inset: "-5%",
          willChange: "transform",
        }}
      >
        <Image
          src={CITY_PHOTO}
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center 30%",
          }}
        />
      </div>

      {/* ─── Couche 2 : assombrissement + ambiance bleu nuit ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 35%, rgba(6,7,15,0.35) 0%, rgba(6,7,15,0.55) 50%, rgba(6,7,15,0.85) 100%)",
        }}
      />

      {/* Tint indigo très subtil pour cohérence palette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(79,70,229,0.10) 0%, transparent 35%, transparent 65%, rgba(6,182,212,0.06) 100%)",
          mixBlendMode: "screen",
        }}
      />

      {/* ─── Couche 3 : trainées lumineuses animées (SVG) ─── */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "screen",
          filter: "blur(0.4px)",
        }}
      >
        <defs>
          {/* Gradient violet — trail principal */}
          <linearGradient id="trail-violet" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(124,92,252,0)" />
            <stop offset="40%" stopColor="rgba(124,92,252,0.55)" />
            <stop offset="60%" stopColor="rgba(192,132,252,0.95)" />
            <stop offset="100%" stopColor="rgba(124,92,252,0)" />
          </linearGradient>

          {/* Gradient cyan — pour variation */}
          <linearGradient id="trail-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.7)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>

          {/* Gradient rose magenta — accent secondaire */}
          <linearGradient id="trail-pink" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(244,114,182,0)" />
            <stop offset="50%" stopColor="rgba(244,114,182,0.85)" />
            <stop offset="100%" stopColor="rgba(244,114,182,0)" />
          </linearGradient>

          {/* Filtre glow pour les trainées */}
          <filter id="trail-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Trails — courbes qui suivent des "routes" plausibles
            Animation : stroke-dashoffset qui parcourt le path */}
        <g filter="url(#trail-glow)" fill="none">
          {/* Trail 1 — grande courbe horizontale (autoroute) */}
          <path
            d="M -100 650 C 400 600, 800 580, 1700 550"
            stroke="url(#trail-violet)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="280 1900"
            style={{ animation: "trail-flow 7.5s linear infinite" }}
          />
          {/* Trail 2 — diagonale, vitesse différente */}
          <path
            d="M -100 730 C 350 700, 750 620, 1700 480"
            stroke="url(#trail-pink)"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeDasharray="180 2100"
            style={{ animation: "trail-flow 11s linear infinite", animationDelay: "1.4s" }}
          />
          {/* Trail 3 — perspective vers la profondeur */}
          <path
            d="M 200 880 C 500 720, 850 600, 1100 480"
            stroke="url(#trail-violet)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="220 1500"
            style={{ animation: "trail-flow 9s linear infinite", animationDelay: "0.6s" }}
          />
          {/* Trail 4 — accent cyan court */}
          <path
            d="M 1100 700 C 1280 660, 1450 600, 1700 540"
            stroke="url(#trail-cyan)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="120 900"
            style={{ animation: "trail-flow 6s linear infinite", animationDelay: "2s" }}
          />
          {/* Trail 5 — passage rapide */}
          <path
            d="M -50 580 C 380 540, 760 510, 1700 470"
            stroke="url(#trail-violet)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="150 2000"
            style={{ animation: "trail-flow 8s linear infinite", animationDelay: "3.5s" }}
          />
          {/* Trail 6 — second axe pink en background */}
          <path
            d="M 1700 620 C 1300 580, 850 540, -100 520"
            stroke="url(#trail-pink)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeDasharray="160 2200"
            style={{ animation: "trail-flow-reverse 10s linear infinite", animationDelay: "5s" }}
          />
        </g>
      </svg>

      {/* ─── Couche 4 : twinkling building windows ─── */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      >
        {twinkleDots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill={d.warm ? "rgba(255,210,140,0.9)" : "rgba(180,200,255,0.85)"}
            style={{
              animation: `twinkle-fade ${d.dur}s ease-in-out ${d.delay}s infinite alternate`,
            }}
          />
        ))}
      </svg>

      {/* ─── Couche 5 : vignette + bottom fade vers content suivant ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 100% 70% at 50% 100%, rgba(6,7,15,0.4) 0%, transparent 50%)," +
            "linear-gradient(180deg, transparent 0%, transparent 75%, var(--surface-1) 100%)",
        }}
      />

      <style jsx>{`
        @keyframes trail-flow {
          0% { stroke-dashoffset: 2200; }
          100% { stroke-dashoffset: -200; }
        }
        @keyframes trail-flow-reverse {
          0% { stroke-dashoffset: -200; }
          100% { stroke-dashoffset: 2200; }
        }
        @keyframes twinkle-fade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ─── 80 fenêtres scintillantes générées pseudo-aléatoirement ─── */
type Dot = { x: number; y: number; r: number; dur: number; delay: number; warm: boolean }
const twinkleDots: Dot[] = (() => {
  // PRNG déterministe — SSR/CSR identical
  let s = 7
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const dots: Dot[] = []
  // 80 points concentrés dans la zone bâtiments (haut + milieu)
  for (let i = 0; i < 90; i++) {
    dots.push({
      x: rand() * 1600,
      y: 60 + rand() * 580, // évite la zone routes en bas
      r: 0.6 + rand() * 0.9,
      dur: 2 + rand() * 5,
      delay: rand() * 6,
      warm: rand() < 0.7, // 70% warm (orange tungstène), 30% cool
    })
  }
  return dots
})()
