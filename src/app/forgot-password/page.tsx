"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erreur."); return; }
    setDone(true);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0F", color:"#F1F0FF", display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ marginBottom:32 }}><Logo size={32} /></div>
        <div style={{ background:"var(--clr-card)", border:"1px solid var(--clr-border)", borderRadius:16, padding:28 }}>
          <h1 style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:8 }}>Mot de passe oublié</h1>
          {done ? (
            <p style={{ color:"#22D3A0", lineHeight:1.7 }}>✅ Si cet email existe, un lien de réinitialisation a été envoyé. Vérifiez votre boîte mail.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ color:"#9B99B5", fontSize:"0.9rem", marginBottom:20 }}>Entrez votre email et nous vous enverrons un lien de réinitialisation.</p>
              <input className="form-input" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ marginBottom:16, display:"block", width:"100%" }} />
              {error && <p style={{ color:"#FC5C7C", fontSize:"0.85rem", marginBottom:12 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width:"100%", padding:"12px", borderRadius:12, background:"linear-gradient(135deg,#7C5CFC,#5B3EE8)", color:"#fff", fontWeight:700, border:"none", cursor:"pointer" }}>
                {loading ? "Envoi..." : "Envoyer le lien"}
              </button>
            </form>
          )}
          <div style={{ marginTop:20, textAlign:"center" }}>
            <Link href="/login" style={{ color:"#9B82FD", fontSize:"0.875rem" }}>← Retour à la connexion</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
