"use client";

import { useEffect } from "react";

/**
 * Smooth scroll provider — desktop only, dynamic import.
 *
 * Perf rationale :
 *   - Lenis lib (~12 KB gzip) chargée *uniquement* sur desktop pointer-fine
 *   - Mobile : native scroll est déjà fluide, on évite la RAF continue
 *   - prefers-reduced-motion → skip complet
 *   - Le code en dehors du useEffect n'importe rien de lenis → bundle initial épargné
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

    let raf = 0;
    let destroyed = false;
    let cleanupListener: (() => void) | null = null;
    let lenisInstance: { raf: (t: number) => void; scrollTo: (t: HTMLElement, opts: { offset: number; duration: number }) => void; destroy: () => void } | null = null;

    void import("lenis").then(({ default: Lenis }) => {
      if (destroyed) return;
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      });
      lenisInstance = lenis;

      const loop = (time: number) => {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const onAnchorClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        const link = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
        if (!link) return;
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -80, duration: 1.4 });
      };
      document.addEventListener("click", onAnchorClick);
      cleanupListener = () => document.removeEventListener("click", onAnchorClick);
    });

    return () => {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      cleanupListener?.();
      lenisInstance?.destroy();
    };
  }, []);

  return <>{children}</>;
}
