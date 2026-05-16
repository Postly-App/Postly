"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";

const SUPPORT = "support@getpostly.space";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("website")) return;
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          subject: fd.get("subject"),
          message: fd.get("message"),
          website: fd.get("website"),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("err");
        setMsg((j as { error?: string }).error ?? "Envoi impossible.");
        return;
      }
      setStatus("ok");
      setMsg("Message envoyé. Nous vous répondrons rapidement.");
      e.currentTarget.reset();
    } catch {
      setStatus("err");
      setMsg("Erreur réseau.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)", fontFamily: "var(--font)" }}>
      <header style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/" style={{ fontWeight: 700, color: "var(--clr-primary-h)", textDecoration: "none" }}>← Accueil</Link>
      </header>
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 12 }}>Contact</h1>
        <p style={{ color: "var(--clr-muted)", lineHeight: 1.7, marginBottom: 28 }}>
          Une question sur Postly ? Écrivez-nous ou appelez le support.
        </p>
        <div style={{ marginBottom: 28, lineHeight: 1.8 }}>
          <div><strong>Email</strong> : <a href={`mailto:${SUPPORT}`} style={{ color: "var(--clr-primary-h)" }}>{SUPPORT}</a></div>
          <div><strong>Téléphone</strong> : <a href="tel:+33769209031" style={{ color: "var(--clr-primary-h)" }}>+33 7 69 20 90 31</a></div>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, opacity: 0, height: 0, width: 0 }} />
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Nom</span>
            <input name="name" required maxLength={120} style={inp} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Email</span>
            <input name="email" type="email" required maxLength={200} style={inp} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Sujet</span>
            <input name="subject" required maxLength={200} style={inp} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Message</span>
            <textarea name="message" required minLength={10} maxLength={4000} rows={6} style={{ ...inp, resize: "vertical" }} />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              marginTop: 8,
              padding: "14px 22px",
              borderRadius: 14,
              border: "none",
              fontWeight: 700,
              cursor: status === "loading" ? "wait" : "pointer",
              background: "linear-gradient(135deg,var(--clr-primary),#5B3EE8)",
              color: "#fff",
            }}
          >
            {status === "loading" ? "Envoi…" : "Envoyer"}
          </button>
        </form>
        {msg && (
          <p style={{ marginTop: 20, color: status === "ok" ? "var(--clr-green)" : "#f87171", fontSize: "0.95rem" }}>
            {msg}
          </p>
        )}
      </main>
    </div>
  );
}

const inp: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(17,17,24,0.8)",
  color: "var(--clr-text)",
  fontSize: "0.95rem",
};
