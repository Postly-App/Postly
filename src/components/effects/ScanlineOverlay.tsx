"use client"

/**
 * Scanlines overlay — fines lignes horizontales en mix-blend overlay,
 * pour donner le feel "cyberpunk LCD" sans agresser la lecture.
 * Désactivé automatiquement via prefers-reduced-motion (CSS).
 */
export default function ScanlineOverlay() {
  return <div className="scanlines-overlay" aria-hidden="true" />
}
