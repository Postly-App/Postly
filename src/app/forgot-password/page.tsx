"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0F", color: "#F1F0FF",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 24px", fontFamily: "var(--font)",
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ marginBottom: 40 }}>
          <Logo size={32} />
        </div>

        <div style={{
          background: "var(--clr-card)",
          border: "1px solid var(--clr-border)",
          borderRadius: 16, padding: 28,
        }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>🛠️</div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 10, letterSpacing: "-0.5px" }}>
            Réinitialisation par email — bientôt disponible
          </h1>
          <p style={{ color: "#9B99B5", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 20 }}>
            Le flux d&apos;envoi de lien de réinitialisation par email n&apos;est pas encore activé. En attendant, contactez le support à{" "}
            <a href="mailto:contact@postly.app" style={{ color: "#9B82FD", fontWeight: 600 }}>
              contact@postly.app
            </a>{" "}
            pour réinitialiser votre mot de passe.
          </p>
          <p style={{ color: "#9B99B5", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: 24 }}>
            Si vous vous êtes connecté via Google ou GitHub, utilisez simplement le bouton OAuth correspondant sur la page de connexion.
          </p>
          <Link href="/login" style={{
            display: "inline-block", padding: "11px 24px", borderRadius: 12,
            background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)", color: "#fff",
            fontWeight: 700, fontSize: "0.875rem", textDecoration: "none",
            boxShadow: "0 0 16px rgba(124,92,252,0.35)",
          }}>← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}
