"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
    toast.success("Email envoyé si ce compte existe !");
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0F", color: "#F1F0FF",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 24px", fontFamily: "var(--font)",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ marginBottom: 40 }}>
          <Logo size={32} />
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📬</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 12 }}>Email envoyé !</h1>
            <p style={{ color: "#9B99B5", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 28 }}>
              Si un compte existe pour <strong style={{ color: "#F1F0FF" }}>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <Link href="/login" style={{
              display: "inline-block", padding: "11px 28px", borderRadius: 12,
              background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)", color: "#fff",
              fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
            }}>Retour à la connexion</Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>
              Mot de passe oublié ?
            </h1>
            <p style={{ color: "#9B99B5", marginBottom: 32, fontSize: "0.9rem" }}>
              Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 8, color: "#9B99B5" }}>
                  Adresse email
                </label>
                <input
                  type="email" value={email} required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  autoComplete="email"
                  className="form-input"
                />
              </div>
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
                  color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                  boxShadow: "0 0 20px rgba(124,92,252,0.4)", fontFamily: "var(--font)",
                }}
              >
                {loading ? "Envoi en cours…" : "Envoyer le lien →"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.875rem", color: "#9B99B5" }}>
              <Link href="/login" style={{ color: "#9B82FD", fontWeight: 600 }}>← Retour à la connexion</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
