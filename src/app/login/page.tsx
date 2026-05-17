"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Logo from "@/components/Logo";

/* ─── Google SVG ─────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

/* ─── Benefit item ───────────────────────────────────────── */
function Benefit({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
      <div style={{
        width: 38, height: 38, flexShrink: 0,
        background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.25)",
        borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1rem",
      }}>{icon}</div>
      <div>
        <strong style={{ display: "block", fontSize: "0.95rem", fontWeight: 700, marginBottom: 4, color: "#F1F0FF" }}>
          {title}
        </strong>
        <span style={{ fontSize: "0.82rem", color: "#9B99B5" }}>{desc}</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (!error) return;
    if (error === "Configuration") {
      toast.error("OAuth non configuré — utilise email/mot de passe pour l'instant");
    } else if (error === "AccessDenied") {
      toast.error("Accès refusé par le fournisseur OAuth");
    } else if (error === "OAuthCallback" || error === "OAuthSignin") {
      toast.error("Erreur OAuth. Réessaie ou utilise email/mot de passe.");
    } else {
      toast.error("Erreur de connexion. Réessaie.");
    }
    window.history.replaceState({}, "", "/login");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error("Email ou mot de passe invalide");
    } else {
      toast.success("Bon retour parmi nous 👋");
      router.push("/dashboard");
    }
  };

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr",
      minHeight: "100vh",
      background: "var(--clr-bg)", color: "#F1F0FF",
      fontFamily: "var(--font)",
    }}>
      {/* ── LEFT ────────────────────────────────────────────── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg,#1A0F3C 0%,#0A0A0F 50%,#0D1A12 100%)",
        padding: "60px 48px",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }} className="auth-left-panel">
        {/* Orbs */}
        <div aria-hidden="true" style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(124,92,252,0.3),transparent 70%)",
          top: "-100px", left: "-100px", filter: "blur(60px)",
          animation: "orbFloat1 18s ease-in-out infinite",
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(34,211,160,0.2),transparent 70%)",
          bottom: "-50px", right: "-50px", filter: "blur(60px)",
          animation: "orbFloat2 22s ease-in-out infinite",
        }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Logo */}
          <div style={{ marginBottom: 40 }}>
            <Logo size={32} />
          </div>

          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 12 }}>
            Votre cockpit de contenu
          </h2>
          <p style={{ color: "#9B99B5", marginBottom: 40, lineHeight: 1.6, fontSize: "0.95rem" }}>
            Postly centralise vos réseaux sociaux et votre workflow de contenu dans une seule interface.
          </p>

          <Benefit icon="📅" title="Calendrier multi-réseaux" desc="Programmez vos posts sur 7 plateformes depuis un seul calendrier" />
          <Benefit icon="🤖" title="Assistant IA intégré" desc="Génère vos légendes et propose des hashtags pertinents" />
          <Benefit icon="📊" title="Analytics unifiés" desc="Suivez vos performances sur tous vos réseaux sans changer d'onglet" />

          <div style={{
            marginTop: 48, padding: 24,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(52,211,153,0.14)",
              border: "1px solid rgba(52,211,153,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.05rem", flexShrink: 0,
            }}>🔒</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 4 }}>
                Hébergé en Europe — conforme RGPD
              </div>
              <div style={{ fontSize: "0.78rem", color: "#9B99B5", lineHeight: 1.55 }}>
                Vos données et celles de vos clients restent sur des serveurs européens.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT ───────────────────────────────────────────── */}
      <div style={{
        background: "var(--clr-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "60px 48px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>
            Bon retour 👋
          </h1>
          <p style={{ color: "#9B99B5", marginBottom: 36, fontSize: "0.9rem" }}>
            Connectez-vous à votre compte Postly
          </p>

          {/* OAuth */}
          <OAuthBtn icon={<GoogleIcon />} label="Continuer avec Google" onClick={() => signIn("google", { callbackUrl: "/dashboard" })} />
          <OAuthBtn icon={<GithubIcon />} label="Continuer avec GitHub" onClick={() => signIn("github", { callbackUrl: "/dashboard" })} />

          <OAuthDivider>ou par email</OAuthDivider>

          <form onSubmit={handleSubmit} noValidate>
            <FormGroup label="Adresse email" htmlFor="login-email">
              <input
                id="login-email" type="email" value={email} required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                autoComplete="email"
                className="form-input"
              />
            </FormGroup>
            <FormGroup label="Mot de passe" htmlFor="login-pass">
              <input
                id="login-pass" type="password" value={password} required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="form-input"
              />
            </FormGroup>
            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <Link href="/forgot-password" style={{ fontSize: "0.8rem", color: "#9B82FD" }}>Mot de passe oublié ?</Link>
            </div>
            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 16, border: "none",
                background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
                color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                boxShadow: "0 0 20px rgba(124,92,252,0.4)", transition: "var(--transition)",
                fontFamily: "var(--font)",
              }}
            >
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.875rem", color: "#9B99B5" }}>
            Pas encore de compte ?{" "}
            <Link href="/signup" style={{ color: "#9B82FD", fontWeight: 600 }}>Créer un compte</Link>
          </p>
        </div>
      </div>

      {/* Hide left panel on mobile */}
      <style>{`
        @media (max-width: 768px) { .auth-left-panel { display: none; } }
        @media (max-width: 768px) { div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

/* ── Shared sub-components ────────────────────────────────── */
function OAuthBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        width: "100%", background: "var(--clr-card)",
        border: "1px solid var(--clr-border)", borderRadius: 16,
        padding: 12, fontSize: "0.875rem", fontWeight: 600,
        color: "#F1F0FF", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 10, marginBottom: 10,
        cursor: "pointer", transition: "var(--transition)",
        fontFamily: "var(--font)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = "rgba(255,255,255,0.07)";
        el.style.borderColor = "rgba(124,92,252,0.3)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = "var(--clr-card)";
        el.style.borderColor = "var(--clr-border)";
        el.style.transform = "translateY(0)";
      }}
    >
      {icon} {label}
    </button>
  );
}

function OAuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#9B99B5", fontSize: "0.8rem", margin: "24px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--clr-border)" }} />
      {children}
      <div style={{ flex: 1, height: 1, background: "var(--clr-border)" }} />
    </div>
  );
}

function FormGroup({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        htmlFor={htmlFor}
        style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 8, color: "#9B99B5" }}
      >{label}</label>
      {children}
    </div>
  );
}
