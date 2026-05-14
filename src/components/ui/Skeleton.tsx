"use client"

import React from "react"

/**
 * Skeleton premium — shimmer fluide GPU-only, sans flicker.
 * Linear/Apple style : low contrast, mouvement subtil, pas de "blocs gris".
 */

interface SkeletonProps {
  width?: number | string
  height?: number | string
  radius?: number | string
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ width, height = 14, radius = 6, className, style }: SkeletonProps) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: typeof width === "number" ? `${width}px` : width ?? "100%",
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: typeof radius === "number" ? `${radius}px` : radius,
        background:
          "linear-gradient(90deg, " +
          "rgba(180,200,255,0.04) 0%, " +
          "rgba(180,200,255,0.10) 50%, " +
          "rgba(180,200,255,0.04) 100%)",
        backgroundSize: "200% 100%",
        animation: "postly-shimmer 1.6s linear infinite",
        ...style,
      }}
    />
  )
}

export function SkeletonCard({ height = 120, style }: { height?: number; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        borderRadius: 14,
        background: "var(--surface-2)",
        border: "1px solid var(--line-2)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...style,
      }}
    >
      <Skeleton width={32} height={32} radius={8} />
      <Skeleton width="60%" height={14} />
      <Skeleton width="90%" height={10} />
      <Skeleton width="40%" height={10} />
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 10,
            background: "var(--surface-2)",
            border: "1px solid var(--line-2)",
          }}
        >
          <Skeleton width={28} height={28} radius={8} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width="40%" height={10} />
            <Skeleton width="70%" height={9} />
          </div>
        </div>
      ))}
    </div>
  )
}
