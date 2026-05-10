"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * BootSplash — brief cinematic intro shown once per session,
 * then dissolves into the scene.
 */
export default function BootSplash() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState(0); // 0: scan, 1: brand reveal, 2: exit

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("postly_booted") === "1") {
      setVisible(false);
      return;
    }
    sessionStorage.setItem("postly_booted", "1");
    document.body.style.overflow = "hidden";

    const t1 = setTimeout(() => setPhase(1), 650);
    const t2 = setTimeout(() => setPhase(2), 1700);
    const t3 = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: EASE } }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "#050509",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Subtle grid background */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(124,92,252,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.06) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(circle at 50% 50%, black 0%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(circle at 50% 50%, black 0%, transparent 70%)",
            }}
          />

          {/* Scan line */}
          <motion.div
            aria-hidden="true"
            initial={{ y: "-10%" }}
            animate={{ y: "110%" }}
            transition={{ duration: 1.6, ease: "linear" }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, rgba(124,92,252,0.85), transparent)",
              boxShadow: "0 0 24px rgba(124,92,252,0.7)",
            }}
          />

          {/* Brand reveal */}
          <motion.div
            initial={{ opacity: 0, y: 12, letterSpacing: "0.5em" }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : 12,
              letterSpacing: phase >= 1 ? "-2px" : "0.5em",
            }}
            transition={{ duration: 0.7, ease: EASE }}
            style={{
              position: "relative",
              fontSize: "clamp(2.4rem, 6vw, 4.4rem)",
              fontWeight: 800,
              color: "#F1F0FF",
              textAlign: "center",
            }}
          >
            <span
              style={{
                background:
                  "linear-gradient(135deg, #fff 30%, #9B82FD 70%, #F06292)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              POSTLY
            </span>
            {/* Cursor caret */}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              style={{
                display: "inline-block",
                width: 4,
                height: "0.85em",
                background: "#9B82FD",
                marginLeft: 8,
                verticalAlign: "middle",
                boxShadow: "0 0 12px #9B82FD",
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 1 ? 1 : 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              style={{
                marginTop: 14,
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.4em",
                color: "rgba(155,153,181,0.8)",
                textTransform: "uppercase",
              }}
            >
              Initialisation du studio · v2.0
            </motion.div>
          </motion.div>

          {/* Vignette */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              boxShadow: "inset 0 0 200px rgba(0,0,0,0.7)",
              pointerEvents: "none",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
