"use client";

import { useEffect } from "react";

/**
 * CustomCursor — soft glowing dot + delayed ring that lerps toward
 * the mouse. Adds `cursor-hover` class to body when over interactive
 * elements (handled by globals.css for size/glow change).
 *
 * Disabled on touch devices and when prefers-reduced-motion is set.
 */
export default function CustomCursor() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isCoarse || reduced) return;

    const dot = document.createElement("div");
    dot.id = "cursor";
    const ring = document.createElement("div");
    ring.id = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add("has-custom-cursor");

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
    };
    const onDown = () => document.body.classList.add("cursor-down");
    const onUp = () => document.body.classList.remove("cursor-down");

    const HOVER_SEL = 'a, button, [role="button"], input, textarea, select, label, [data-magnetic], [data-cursor-hover]';
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest(HOVER_SEL)) document.body.classList.add("cursor-hover");
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest(HOVER_SEL)) document.body.classList.remove("cursor-hover");
    };

    const tick = () => {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      dot.remove();
      ring.remove();
      document.body.classList.remove("has-custom-cursor", "cursor-hover", "cursor-down");
    };
  }, []);

  return null;
}
