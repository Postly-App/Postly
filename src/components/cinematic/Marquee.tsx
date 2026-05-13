"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SocialIcon from "@/components/SocialIcon";
import { PLATFORM_IDS, type PlatformId } from "@/lib/platforms";

const DISPLAY: Partial<Record<PlatformId, string>> = {
  INSTAGRAM: "Instagram",
  TWITTER: "Twitter / X",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  FACEBOOK: "Facebook",
  THREADS: "Threads",
  PINTEREST: "Pinterest",
  BLUESKY: "Bluesky",
};

export default function Marquee() {
  const seq = [...PLATFORM_IDS, ...PLATFORM_IDS];

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
          {seq.map((platformId, i) => {
            const label = DISPLAY[platformId] ?? platformId;
            const plan = i % 2 === 0 ? "pro" : "agency";
            return (
              <Link
                key={`${platformId}-${i}`}
                href={`/pricing?plan=${plan}`}
                scroll={false}
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
                  textDecoration: "none",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <SocialIcon platform={platformId} size={22} />
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(241,240,255,0.85)" }}>{label}</span>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
