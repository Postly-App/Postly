"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Hero background — vidéo aérienne ville la nuit, self-hostée.
 *
 * Stratégie de perf :
 *   1. Poster JPG en CSS background = LCP-instant (56 KB, dans /public/bg/)
 *   2. Vidéo NON rendue côté serveur — chargée après first paint via state
 *   3. Detection mobile → bascule sur version 720x404 (267 KB au lieu de 663 KB)
 *   4. Connection-aware : skip vidéo si Save-Data ou effectiveType slow-2g/2g
 *   5. document.visibilitychange : pause quand l'onglet est inactif (CPU saved)
 *   6. prefers-reduced-motion → poster only, jamais de vidéo
 *
 * Le contenu de la page passe par-dessus via z-index: 3 (déjà géré dans page.tsx).
 */

const VIDEO_DESKTOP = "/bg/city-night.mp4"
const VIDEO_MOBILE = "/bg/city-night-mobile.mp4"
const POSTER = "/bg/city-night-poster.jpg"

export default function CityVideoBackground() {
  const [shouldPlay, setShouldPlay] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Respect user preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Skip on extreme slow connections / Data Saver
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (conn?.saveData) return
    if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") return

    const mobile = window.innerWidth < 768
    setVideoSrc(mobile ? VIDEO_MOBILE : VIDEO_DESKTOP)

    // Defer video mount until after first paint to keep LCP fast
    const trigger = () => setShouldPlay(true)
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(trigger, { timeout: 600 })
      return () => w.cancelIdleCallback?.(id)
    }
    const t = setTimeout(trigger, 250)
    return () => clearTimeout(t)
  }, [])

  // Pause video when tab inactive / page hidden
  useEffect(() => {
    if (!shouldPlay) return
    const onVis = () => {
      const v = videoRef.current
      if (!v) return
      if (document.hidden) {
        v.pause()
      } else {
        void v.play().catch(() => {})
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [shouldPlay])

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        backgroundImage: `url(${POSTER})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#06070B",
      }}
    >
      {shouldPlay && videoSrc && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={POSTER}
          onCanPlay={(e) => {
            // Some browsers (iOS) need explicit play() after canplay
            void (e.currentTarget as HTMLVideoElement).play().catch(() => {})
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* ─── Couche 1 : dark scrim — assure lisibilité du contenu ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 35%, rgba(6,7,15,0.45) 0%, rgba(6,7,15,0.7) 60%, rgba(6,7,15,0.92) 100%)",
        }}
      />

      {/* ─── Couche 2 : indigo + cyan tint pour cohérence palette ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(79,70,229,0.18) 0%, transparent 30%, transparent 70%, rgba(6,182,212,0.12) 100%)",
          mixBlendMode: "screen",
        }}
      />

      {/* ─── Couche 3 : vignette latérale ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, transparent 0%, rgba(6,7,15,0.35) 75%, rgba(6,7,15,0.6) 100%)",
        }}
      />
    </div>
  )
}
