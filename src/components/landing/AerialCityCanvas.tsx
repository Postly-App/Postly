"use client"

import { motion } from "framer-motion"
import { useEffect, useRef } from "react"

/**
 * Vue top-down d'une ville la nuit — 100% procédural, cinématique.
 *
 * Couches (du fond vers la lumière) :
 *   1. Canvas : fond nuit + rues + immeubles + fenêtres scintillantes (pré-rendu)
 *   2. Canvas : voitures + trainées long-exposure (additive blending) + intersections pulsantes
 *   3. Framer-motion : brouillard / aurore qui dérive, hélico occasionnel
 *   4. Vignette + overlay de lisibilité
 *
 * Effets cinématiques :
 *   - Drone pan : caméra dérive lentement en X/Y (sinusoïdal)
 *   - Breathing zoom : 1.0 ↔ 1.04 sur 24s
 *   - Intersections pulsent à intervalles aléatoires
 *   - Lights warm/cool mix réaliste
 *   - Aurora colored wash sur les bords (indigo + cyan)
 *
 * Perf :
 *   - Pre-render couche statique en offscreen canvas (rues + immeubles)
 *   - ~70 voitures, history buffer 28 frames
 *   - clamp dpr ≤ 2
 *   - Reduce motion friendly (prefers-reduced-motion = static frame)
 */

interface Car {
  street: number
  t: number
  speed: number
  reverse: boolean
  hue: number
  size: number
  history: { x: number; y: number }[]
}

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface Win {
  x: number
  y: number
  r: number
  warm: boolean
  baseAlpha: number
  twinkleDur: number
  twinkleOffset: number
}

interface Intersection {
  x: number
  y: number
  pulseOffset: number
}

const TRAIL_LEN = 32

export default function AerialCityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvasInit = canvasRef.current
    const container = containerRef.current
    if (!canvasInit || !container) return
    const ctxInit = canvasInit.getContext("2d", { alpha: true })
    if (!ctxInit) return

    // Alias non-nullables pour les closures (build, tick)
    const canvas: HTMLCanvasElement = canvasInit
    const ctx: CanvasRenderingContext2D = ctxInit

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let cssW = 0
    let cssH = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    let streets: Segment[] = []
    let cars: Car[] = []
    let wins: Win[] = []
    let intersections: Intersection[] = []
    let staticLayer: HTMLCanvasElement | null = null

    let seed = 1337
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }

    function build() {
      seed = 1337
      cssW = window.innerWidth
      cssH = window.innerHeight
      // Surdimensionne légèrement pour absorber le drone pan
      const overshoot = 60
      const renderW = cssW + overshoot * 2
      const renderH = cssH + overshoot * 2
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = renderW * dpr
      canvas.height = renderH * dpr
      canvas.style.width = renderW + "px"
      canvas.style.height = renderH + "px"
      canvas.style.marginLeft = -overshoot + "px"
      canvas.style.marginTop = -overshoot + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      streets = []
      cars = []
      wins = []
      intersections = []

      // ── RUES ──
      const HSPACING = Math.max(110, Math.min(180, renderH / 7))
      let y = 40 + rand() * 50
      while (y < renderH + 40) {
        const dy = (rand() - 0.5) * 50
        streets.push({ x1: -100, y1: y - dy, x2: renderW + 100, y2: y + dy })
        y += HSPACING + (rand() - 0.5) * 35
      }
      const VSPACING = Math.max(140, Math.min(220, renderW / 9))
      let x = 60 + rand() * 70
      while (x < renderW + 40) {
        const dx = (rand() - 0.5) * 60
        streets.push({ x1: x - dx, y1: -100, x2: x + dx, y2: renderH + 100 })
        x += VSPACING + (rand() - 0.5) * 45
      }
      // Diagonales
      for (let i = 0; i < 3; i++) {
        const angle = (rand() < 0.5 ? 1 : -1) * (0.15 + rand() * 0.20)
        const startY = -120 + rand() * renderH * 0.7
        streets.push({
          x1: -120,
          y1: startY,
          x2: renderW + 120,
          y2: startY + (renderW + 240) * angle,
        })
      }

      // ── INTERSECTIONS — détecte croisements de rues h/v ──
      // On stocke intersections aléatoires plutôt que vraies (perf)
      for (let i = 0; i < 20; i++) {
        intersections.push({
          x: rand() * renderW,
          y: rand() * renderH,
          pulseOffset: rand() * 8000,
        })
      }

      // ── VOITURES ──
      const carCount = Math.min(80, Math.max(45, Math.floor((renderW * renderH) / 28000)))
      for (let i = 0; i < carCount; i++) {
        const streetIdx = Math.floor(rand() * streets.length)
        const hueRoll = rand()
        const hue = hueRoll < 0.55
          ? 20 + rand() * 12    // 55% orange chaud (lampadaire / phares warm)
          : hueRoll < 0.78
          ? 195 + rand() * 25   // 23% bleu froid (xenon)
          : hueRoll < 0.93
          ? 278 + rand() * 22   // 15% violet/magenta (creative accent)
          :                       340 + rand() * 22  // 7% rose
        cars.push({
          street: streetIdx,
          t: rand(),
          speed: 0.0008 + rand() * 0.0024,
          reverse: rand() < 0.5,
          hue,
          size: 1.0 + rand() * 1.2,
          history: [],
        })
      }

      // ── FENÊTRES SCINTILLANTES ──
      const winCount = Math.min(1100, Math.floor((renderW * renderH) / 1600))
      for (let i = 0; i < winCount; i++) {
        wins.push({
          x: rand() * renderW,
          y: rand() * renderH,
          r: 0.45 + rand() * 0.85,
          warm: rand() < 0.72,
          baseAlpha: 0.20 + rand() * 0.55,
          twinkleDur: 1500 + rand() * 5500,
          twinkleOffset: rand() * 6000,
        })
      }

      // ── PRE-RENDER COUCHE STATIQUE ──
      staticLayer = document.createElement("canvas")
      staticLayer.width = canvas.width
      staticLayer.height = canvas.height
      const sctx = staticLayer.getContext("2d")
      if (sctx) {
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        // Fond nuit avec radial gradient cosmique
        const baseGrad = sctx.createRadialGradient(
          renderW * 0.5, renderH * 0.35, renderW * 0.04,
          renderW * 0.5, renderH * 0.5, Math.max(renderW, renderH) * 0.9
        )
        baseGrad.addColorStop(0, "#0C0F1C")
        baseGrad.addColorStop(0.5, "#06080F")
        baseGrad.addColorStop(1, "#01020A")
        sctx.fillStyle = baseGrad
        sctx.fillRect(0, 0, renderW, renderH)

        // Halos d'ambiance — zones lumineuses diffuses (districts éclairés)
        sctx.globalCompositeOperation = "screen"
        for (let i = 0; i < 70; i++) {
          const cx = rand() * renderW
          const cy = rand() * renderH
          const r = 90 + rand() * 250
          const blob = sctx.createRadialGradient(cx, cy, 0, cx, cy, r)
          const roll = rand()
          if (roll < 0.6) {
            blob.addColorStop(0, "rgba(255,168,80,0.07)") // warm streetlight halo
          } else if (roll < 0.85) {
            blob.addColorStop(0, "rgba(120,160,240,0.05)") // cool office
          } else {
            blob.addColorStop(0, "rgba(180,120,240,0.05)") // creative purple
          }
          blob.addColorStop(1, "rgba(0,0,0,0)")
          sctx.fillStyle = blob
          sctx.fillRect(cx - r, cy - r, r * 2, r * 2)
        }
        sctx.globalCompositeOperation = "source-over"

        // Rues — base sombre
        sctx.strokeStyle = "rgba(22,28,44,0.95)"
        sctx.lineCap = "round"
        for (const s of streets) {
          sctx.lineWidth = 2.8
          sctx.beginPath()
          sctx.moveTo(s.x1, s.y1)
          sctx.lineTo(s.x2, s.y2)
          sctx.stroke()
        }
        // Trottoirs/bordures fines
        sctx.strokeStyle = "rgba(58,68,98,0.42)"
        sctx.lineWidth = 0.5
        for (const s of streets) {
          sctx.beginPath()
          sctx.moveTo(s.x1, s.y1)
          sctx.lineTo(s.x2, s.y2)
          sctx.stroke()
        }

        // Lampadaires le long des rues
        sctx.fillStyle = "rgba(255,200,140,0.65)"
        for (const s of streets) {
          const dx = s.x2 - s.x1
          const dy = s.y2 - s.y1
          const len = Math.hypot(dx, dy)
          const spacing = 28 + rand() * 24
          const count = Math.floor(len / spacing)
          for (let i = 0; i < count; i++) {
            const t = (i + 0.5) / count
            const px = s.x1 + dx * t
            const py = s.y1 + dy * t
            if (rand() < 0.5) {
              sctx.globalAlpha = 0.35 + rand() * 0.45
              sctx.beginPath()
              sctx.arc(px, py, 0.55 + rand() * 0.6, 0, Math.PI * 2)
              sctx.fill()
            }
          }
        }
        sctx.globalAlpha = 1

        // Vignette
        const vignette = sctx.createRadialGradient(
          renderW * 0.5, renderH * 0.4, Math.min(renderW, renderH) * 0.22,
          renderW * 0.5, renderH * 0.5, Math.max(renderW, renderH) * 0.78
        )
        vignette.addColorStop(0, "rgba(0,0,0,0)")
        vignette.addColorStop(0.6, "rgba(0,0,0,0.28)")
        vignette.addColorStop(1, "rgba(0,0,0,0.7)")
        sctx.fillStyle = vignette
        sctx.fillRect(0, 0, renderW, renderH)

        // Teinte indigo
        sctx.fillStyle = "rgba(40,30,90,0.07)"
        sctx.fillRect(0, 0, renderW, renderH)
      }
    }

    let raf = 0
    let last = performance.now()
    const startTime = performance.now()

    function tick(now: number) {
      if (!ctx || !staticLayer) {
        raf = requestAnimationFrame(tick)
        return
      }
      const dt = Math.min(now - last, 64)
      last = now
      const elapsed = now - startTime

      // ── DRONE PAN — caméra qui dérive doucement ──
      const overshoot = 60
      const driftX = reduce ? 0 : Math.sin(elapsed * 0.00006) * 24
      const driftY = reduce ? 0 : Math.cos(elapsed * 0.00008) * 20
      const zoom = reduce ? 1 : 1 + (Math.sin(elapsed * 0.00007) * 0.5 + 0.5) * 0.04

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply drone transform on the static layer drawing
      const centerX = (cssW + overshoot * 2) / 2
      const centerY = (cssH + overshoot * 2) / 2
      ctx.translate((cssW + overshoot * 2) / 2 * dpr, (cssH + overshoot * 2) / 2 * dpr)
      ctx.scale(zoom * dpr, zoom * dpr)
      ctx.translate(-centerX + driftX, -centerY + driftY)

      ctx.drawImage(staticLayer, 0, 0, staticLayer.width / dpr, staticLayer.height / dpr)

      // ── Fenêtres scintillantes (dynamiques) ──
      for (const w of wins) {
        const phase = ((now + w.twinkleOffset) % w.twinkleDur) / w.twinkleDur
        const pulse = 0.45 + 0.55 * (Math.sin(phase * Math.PI * 2) * 0.5 + 0.5)
        const alpha = w.baseAlpha * pulse
        ctx.globalAlpha = alpha
        ctx.fillStyle = w.warm ? "#FFC787" : "#9DC8FF"
        ctx.beginPath()
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = alpha * 0.22
        ctx.beginPath()
        ctx.arc(w.x, w.y, w.r * 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // ── Intersections pulsantes (halos lumineux) ──
      ctx.globalCompositeOperation = "lighter"
      for (const inter of intersections) {
        const phase = ((now + inter.pulseOffset) % 4000) / 4000
        const pulse = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5
        if (pulse < 0.6) continue
        const intensity = (pulse - 0.6) * 2.5
        const r = 25 + intensity * 35
        const g = ctx.createRadialGradient(inter.x, inter.y, 0, inter.x, inter.y, r)
        g.addColorStop(0, `rgba(255,200,140,${intensity * 0.25})`)
        g.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = g
        ctx.fillRect(inter.x - r, inter.y - r, r * 2, r * 2)
      }

      // ── Voitures + trainées ──
      for (const car of cars) {
        const street = streets[car.street]
        if (!street) continue

        car.t += car.speed * (dt / 16) * (car.reverse ? -1 : 1)
        if (car.t > 1) {
          car.t -= 1
          car.history = []
        } else if (car.t < 0) {
          car.t += 1
          car.history = []
        }

        const px = street.x1 + (street.x2 - street.x1) * car.t
        const py = street.y1 + (street.y2 - street.y1) * car.t

        car.history.unshift({ x: px, y: py })
        if (car.history.length > TRAIL_LEN) car.history.length = TRAIL_LEN

        if (car.history.length > 1) {
          for (let i = 0; i < car.history.length - 1; i++) {
            const a = car.history[i]
            const b = car.history[i + 1]
            const t = i / TRAIL_LEN
            const alpha = (1 - t) * 0.75
            ctx.strokeStyle = `hsla(${car.hue}, 100%, ${62 - i * 0.5}%, ${alpha})`
            ctx.lineWidth = car.size * (1 - t * 0.55)
            ctx.lineCap = "round"
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }

        // Halo de la voiture
        const glowR = car.size * 5
        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR)
        glow.addColorStop(0, `hsla(${car.hue}, 100%, 72%, 1)`)
        glow.addColorStop(0.35, `hsla(${car.hue}, 100%, 60%, 0.55)`)
        glow.addColorStop(1, `hsla(${car.hue}, 100%, 50%, 0)`)
        ctx.fillStyle = glow
        ctx.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2)

        // Core blanc ultra brillant
        ctx.fillStyle = "#FFFFFF"
        ctx.beginPath()
        ctx.arc(px, py, car.size * 0.55, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalCompositeOperation = "source-over"

      raf = requestAnimationFrame(tick)
    }

    build()
    raf = requestAnimationFrame(tick)

    let resizeT: number | null = null
    const onResize = () => {
      if (resizeT) window.clearTimeout(resizeT)
      resizeT = window.setTimeout(build, 200)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      if (resizeT) window.clearTimeout(resizeT)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#01020A",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* ─── Brouillard atmosphérique qui dérive lentement (Framer Motion) ─── */}
      <motion.div
        aria-hidden="true"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 38,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          inset: -100,
          background:
            "radial-gradient(ellipse 50% 30% at 30% 40%, rgba(99,102,241,0.10), transparent 65%)," +
            "radial-gradient(ellipse 40% 30% at 70% 60%, rgba(192,132,252,0.08), transparent 65%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* ─── Aurore latérale qui pulse ─── */}
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "30vw",
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 80% 60% at 0% 50%, rgba(6,182,212,0.10), transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "30vw",
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 80% 60% at 100% 50%, rgba(192,132,252,0.10), transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* ─── Avion / hélico qui traverse occasionnellement ─── */}
      <motion.div
        aria-hidden="true"
        animate={{
          x: ["-10vw", "110vw"],
          y: ["10vh", "70vh"],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 18,
        }}
        style={{
          position: "absolute",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "rgba(255,80,80,1)",
          boxShadow:
            "0 0 12px rgba(255,80,80,0.9), 0 0 24px rgba(255,80,80,0.5), 0 0 40px rgba(255,255,255,0.2)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        aria-hidden="true"
        animate={{
          x: ["110vw", "-10vw"],
          y: ["75vh", "20vh"],
        }}
        transition={{
          duration: 34,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 22,
          delay: 14,
        }}
        style={{
          position: "absolute",
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "rgba(120,200,255,1)",
          boxShadow:
            "0 0 10px rgba(120,200,255,0.9), 0 0 22px rgba(120,200,255,0.5)",
          pointerEvents: "none",
        }}
      />

      {/* ─── Overlay lisibilité contenu (vignette progressive) ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 80% 50% at 50% 30%, transparent 0%, rgba(1,2,10,0.35) 65%, rgba(1,2,10,0.65) 100%)",
        }}
      />
    </div>
  )
}
