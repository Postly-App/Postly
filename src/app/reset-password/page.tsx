"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Logo from "@/components/Logo";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erreur."); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0F", color:"#F1F0FF", display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ marginBottom:32 }}><Logo size={32} /></div>
        <div style={{ background:"var(--clr-card)", border:"1px solid var(--clr-border)", borderRadius:16, padding:28 }}>
          <h1 style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:8 }}>Nouveau mot de passe</h1>
          {done ? (
            <p style={{ color:"#22D3A0" }}>✅ Mot de passe modifié ! Redirection...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <input className="form-input" type="password" placeholder="Nouveau mot de passe" value={password} onChange={e => setPassword(e.target.value)} required style={{ marginBottom:12, display:"block", width:"100%" }} />
              <input className="form-input" type="password" placeholder="Confirmer le mot de passe" value={confirm} onChange={e => setConfirm(e.target.value)} required style={{ marginBottom:16, display:"block", width:"100%" }} />
              {error && <p style={{ color:"#FC5C7C", fontSize:"0.85rem", marginBottom:12 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width:"100%", padding:"12px", borderRadius:12, background:"linear-gradient(135deg,#7C5CFC,#5B3EE8)", color:"#fff", fontWeight:700, border:"none", cursor:"pointer" }}>
                {loading ? "Modification..." : "Modifier le mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
