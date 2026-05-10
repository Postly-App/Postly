"use client";

import { motion } from "framer-motion";

const ITEMS = [
  { name: "Instagram", glyph: "IG", color: "#E1306C" },
  { name: "Twitter / X", glyph: "X", color: "#1DA1F2" },
  { name: "LinkedIn", glyph: "in", color: "#0A66C2" },
  { name: "TikTok", glyph: "TT", color: "#FF0050" },
  { name: "YouTube", glyph: "YT", color: "#FF0000" },
  { name: "Facebook", glyph: "f", color: "#1877F2" },
  { name: "Threads", glyph: "@", color: "#9B99B5" },
  { name: "Pinterest", glyph: "P", color: "#E60023" },
  { name: "Bluesky", glyph: "b", color: "#0085FF" },
];

export default function Marquee() {
  // Duplicate twice so the loop is seamless
  const seq = [...ITEMS, ...ITEMS];

  return (
    <section aria-label="Réseaux supportés" style={{
      padding: "32px 0",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,10,15,0.4)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      position: "relative",
      overflow: "hidden",
    }}>
      <p style={{
        textAlign: "center",
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "rgba(155,153,181,0.7)",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        marginBottom: 18,
      }}>
        Compatible avec tous vos réseaux
      </p>

      <div style={{ position: "relative", width: "100%", overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)" }}>
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, ease: "linear", repeat: Infinity }}
          style={{ display: "flex", gap: 28, width: "max-content" }}
        >
          {seq.map((it, i) => (
            <div
              key={`${it.name}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(17,17,24,0.6)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 8,
                background: `linear-gradient(135deg, ${it.color}, ${it.color}aa)`,
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: 800,
                boxShadow: `0 0 16px ${it.color}40`,
              }}>{it.glyph}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(241,240,255,0.85)" }}>{it.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
