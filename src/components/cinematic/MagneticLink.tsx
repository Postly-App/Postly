"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  strength?: number;       // px max displacement
  external?: boolean;
}

export default function MagneticLink({
  href,
  children,
  className,
  style,
  strength = 18,
  external,
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hover, setHover] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });

  const scale = useSpring(1, { stiffness: 260, damping: 22 });

  // Subtle inner shine that follows cursor
  const shineX = useTransform(sx, (v) => v + 50);
  const shineY = useTransform(sy, (v) => v + 50);

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const max = Math.max(rect.width, rect.height) * 0.9;
    const f = Math.min(1, dist / max);
    x.set((dx / max) * strength);
    y.set((dy / max) * strength * 0.6);
    scale.set(1 + 0.04 * (1 - f));
  };

  const reset = () => {
    x.set(0);
    y.set(0);
    scale.set(1);
    setHover(false);
  };

  const linkProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  const inner = (
    <motion.span
      style={{
        x: sx,
        y: sy,
        scale,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        position: "relative",
        willChange: "transform",
      }}
    >
      {/* Cursor-following shine */}
      <motion.span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: hover ? 0.4 : 0,
          transition: "opacity 0.25s ease",
          background: useTransform(
            [shineX, shineY] as never,
            ([sx, sy]: number[]) =>
              `radial-gradient(160px circle at ${sx}px ${sy}px, rgba(255,255,255,0.18), transparent 60%)`,
          ),
          mixBlendMode: "plus-lighter",
        }}
      />
      {children}
    </motion.span>
  );

  return (
    <Link
      href={href}
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={reset}
      onBlur={reset}
      className={className}
      style={{ display: "inline-flex", overflow: "hidden", position: "relative", ...style }}
      {...linkProps}
    >
      {inner}
    </Link>
  );
}
