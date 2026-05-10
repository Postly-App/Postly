"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  intensity?: number; // degrees max
  glow?: boolean;
}

export default function TiltCard({ children, className, style, intensity = 8, glow = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  const px = useMotionValue(0.5); // 0..1
  const py = useMotionValue(0.5);

  const rx = useTransform(py, [0, 1], [intensity, -intensity]);
  const ry = useTransform(px, [0, 1], [-intensity, intensity]);

  const sRx = useSpring(rx, { stiffness: 200, damping: 18, mass: 0.4 });
  const sRy = useSpring(ry, { stiffness: 200, damping: 18, mass: 0.4 });

  const glowX = useTransform(px, (v) => `${v * 100}%`);
  const glowY = useTransform(py, (v) => `${v * 100}%`);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
    setHover(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={className}
      style={{
        position: "relative",
        transformStyle: "preserve-3d",
        rotateX: sRx,
        rotateY: sRy,
        transition: "box-shadow 0.4s ease",
        willChange: "transform",
        ...style,
      }}
    >
      {glow && (
        <motion.div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: hover ? 1 : 0,
            transition: "opacity 0.35s ease",
            background: useTransform(
              [glowX, glowY] as never,
              ([gx, gy]: string[]) =>
                `radial-gradient(420px circle at ${gx} ${gy}, rgba(124,92,252,0.18), transparent 55%)`,
            ),
            mixBlendMode: "plus-lighter",
          }}
        />
      )}
      <div style={{ position: "relative", transform: "translateZ(20px)", height: "100%" }}>
        {children}
      </div>
    </motion.div>
  );
}
