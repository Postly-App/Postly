import Link from "next/link";

export default function NotFound() {
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
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{
          fontSize: "6rem",
          fontWeight: 900,
          letterSpacing: "-3px",
          background: "linear-gradient(135deg,#7C5CFC,#F06292)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          lineHeight: 1,
          marginBottom: 12,
        }}>
          404
        </div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 10 }}>
          Page introuvable
        </h1>
        <p style={{ color: "#9B99B5", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 24 }}>
          Cette page n&apos;existe pas ou a été déplacée. Vérifie le lien ou retourne à l&apos;accueil.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 10,
            background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            boxShadow: "0 0 24px rgba(124,92,252,0.35)",
          }}>
            Retour à l&apos;accueil
          </Link>
          <Link href="/dashboard" style={{
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
            Aller au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
