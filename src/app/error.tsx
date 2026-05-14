"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("client.error_boundary", {
      route: "app:error",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: "2rem",
      background: "#0A0A0F",
      color: "#F1F0FF",
      fontFamily: "var(--font), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 500, textAlign: "center" }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(252,92,124,0.15)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          fontSize: "2rem",
        }}>
          ⚠️
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 10 }}>
          Une erreur inattendue est survenue
        </h1>
        <p style={{ color: "#9B99B5", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 24 }}>
          On a eu un souci pour afficher cette page. Tu peux réessayer ou retourner à l&apos;accueil.
          Si le problème persiste, écris-nous à <a href="mailto:postlyservice@gmail.com" style={{ color: "#9B82FD" }}>postlyservice@gmail.com</a>.
        </p>
        {error.digest && (
          <p style={{ color: "#5C5A75", fontSize: "0.72rem", fontFamily: "monospace", marginBottom: 20 }}>
            ID erreur : {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset} style={{
            padding: "12px 24px",
            borderRadius: 10,
            background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 24px rgba(124,92,252,0.35)",
          }}>
            Réessayer
          </button>
          <Link href="/" style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 10,
            background: "transparent",
            color: "#F1F0FF",
            fontWeight: 600,
            fontSize: "0.9rem",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.12)",
          }}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
