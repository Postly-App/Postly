"use client";

import { useEffect, useRef } from "react";

/**
 * WindowFrame — adds the impression of looking through a panoramic
 * floor-to-ceiling glass:
 *  - subtle inner room glow (warm)
 *  - diagonal raindrop streaks animated on a canvas
 *  - vertical mullion divisions
 *  - faint reflective bloom
 *
 * Mounted as a fixed overlay above the 3D scene but below content.
 */
export default function WindowFrame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    type Drop = {
      x: number;
      y: number;
      len: number;
      speed: number;
      width: number;
      life: number;
    };

    let drops: Drop[] = [];
    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.6);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      drops.push({
        x: Math.random() * w,
        y: -20 - Math.random() * 60,
        len: 18 + Math.random() * 36,
        speed: 1.6 + Math.random() * 2.2,
        width: 0.5 + Math.random() * 1.0,
        life: 0,
      });
      if (drops.length > 140) drops = drops.slice(-140);
      // Occasional static drop (resting droplet on glass)
      if (Math.random() < 0.04) {
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: 2 + Math.random() * 3,
          speed: 0,
          width: 1.4 + Math.random() * 1.6,
          life: 0,
        });
      }
    };

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(40, now - last) / 16;
      last = now;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Ambient glass haze (subtle warm interior reflection at top)
      const grad = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
      grad.addColorStop(0, "rgba(140,110,90,0.04)");
      grad.addColorStop(0.4, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(80,70,140,0.05)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      if (!prefersReduced) {
        if (Math.random() < 0.7) spawn();

        ctx.lineCap = "round";
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          if (d.speed > 0) {
            d.y += d.speed * dt * 1.6;
            d.x += Math.sin((d.y + d.life) * 0.02) * 0.2;
          }
          d.life += dt;

          // Streak gradient
          const sg = ctx.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
          sg.addColorStop(0, "rgba(170,200,255,0)");
          sg.addColorStop(0.8, "rgba(180,210,255,0.35)");
          sg.addColorStop(1, "rgba(220,230,255,0.7)");
          ctx.strokeStyle = sg;
          ctx.lineWidth = d.width;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y - d.len);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();

          // Tiny head highlight
          if (d.speed > 0) {
            ctx.fillStyle = "rgba(220,230,255,0.55)";
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.width * 0.9, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        drops = drops.filter((d) => d.y < window.innerHeight + 40 && d.life < 800);
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      {/* Rain canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.55,
          mixBlendMode: "screen",
        }}
      />

      {/* Vertical mullions (3 panels) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, transparent calc(33.33% - 0.5px), rgba(255,255,255,0.06) 33.33%, rgba(255,255,255,0.06) calc(33.33% + 0.5px), transparent calc(33.33% + 1px), transparent calc(66.66% - 0.5px), rgba(255,255,255,0.06) 66.66%, rgba(255,255,255,0.06) calc(66.66% + 0.5px), transparent calc(66.66% + 1px))",
          opacity: 0.5,
        }}
      />

      {/* Top reflective horizon highlight */}
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: 90,
          background:
            "linear-gradient(180deg, rgba(124,92,252,0.09) 0%, transparent 100%)",
        }}
      />

      {/* Bottom interior warm wash (room reflection) */}
      <div
        style={{
          position: "absolute",
          inset: "auto 0 0 0",
          height: 220,
          background:
            "linear-gradient(0deg, rgba(255,180,140,0.045) 0%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Soft outer vignette (frame shadow) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 220px rgba(0,0,0,0.55), inset 0 0 60px rgba(0,0,0,0.35)",
        }}
      />
    </div>
  );
}
