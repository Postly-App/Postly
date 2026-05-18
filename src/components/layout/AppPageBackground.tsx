"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Background animé pour les pages app (dashboard / studio / analytics / comptes).
 *
 * Réutilise les mêmes vidéos que la landing (city night) mais avec un scrim
 * beaucoup + sombre, pour garder le contenu UI parfaitement lisible.
 *
 * Optimisations identiques à CityVideoBackground :
 *  - poster JPG instantané
 *  - vidéo deferred via requestIdleCallback
 *  - mobile vidéo réduite (720x404)
 *  - skip si Save-Data / 2G / reduced-motion
 *  - pause sur tab inactif
 *
 * Z-index : `0` → derrière la sidebar (qui est solide) et derrière `<main>`
 * (que la page applique avec `position: relative`). `pointer-events: none`
 * pour ne jamais intercepter les clics.
 */

const VIDEO_DESKTOP = "/bg/city-night.mp4";
const VIDEO_MOBILE = "/bg/city-night-mobile.mp4";
const POSTER = "/bg/city-night-poster.jpg";

export default function AppPageBackground() {
  const [shouldPlay, setShouldPlay] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") return;

    const mobile = window.innerWidth < 768;
    setVideoSrc(mobile ? VIDEO_MOBILE : VIDEO_DESKTOP);

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const trigger = () => setShouldPlay(true);
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(trigger, { timeout: 800 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(trigger, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!shouldPlay) return;
    const onVis = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.hidden) {
        v.pause();
      } else {
        void v.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [shouldPlay]);

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
            void (e.currentTarget as HTMLVideoElement).play().catch(() => {});
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
            opacity: 0.55, // legèrement atténuée
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Scrim sombre — bien + opaque que landing pour conserver lisibilité */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 85% 65% at 50% 35%, rgba(6,7,15,0.72) 0%, rgba(6,7,15,0.86) 55%, rgba(6,7,15,0.96) 100%)",
        }}
      />

      {/* Tint subtil indigo/violet pour cohérence brand */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(124,92,252,0.10) 0%, transparent 35%, transparent 65%, rgba(99,102,241,0.08) 100%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Vignette latérale — fade vers bord */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 110% 90% at 50% 50%, transparent 0%, rgba(6,7,15,0.40) 75%, rgba(6,7,15,0.75) 100%)",
        }}
      />
    </div>
  );
}
