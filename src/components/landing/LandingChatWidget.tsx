"use client";

import { useCallback, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function LandingChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setErr(null);
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    scrollEnd();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const j = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Erreur");
        setMsgs((m) => [...m, { role: "assistant", content: j.error ?? "Une erreur est survenue." }]);
        return;
      }
      setMsgs((m) => [...m, { role: "assistant", content: j.reply ?? "" }]);
    } catch {
      setErr("Réseau");
      setMsgs((m) => [...m, { role: "assistant", content: "Impossible de joindre le serveur. Réessayez ou écrivez à postlyservice@gmail.com" }]);
    } finally {
      setLoading(false);
      scrollEnd();
    }
  }

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 2000, fontFamily: "var(--font)" }}>
      {open && (
        <div style={{
          width: "min(100vw - 40px, 380px)",
          height: 440,
          marginBottom: 14,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(10,10,15,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,92,252,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Assistant Postly</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" style={{
              border: "none",
              background: "transparent",
              color: "var(--clr-muted)",
              cursor: "pointer",
              fontSize: "1.2rem",
              lineHeight: 1,
            }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.length === 0 && (
              <p style={{ color: "var(--clr-muted)", fontSize: "0.88rem", lineHeight: 1.6, margin: 8 }}>
                Posez vos questions sur Postly (fonctionnalités, tarifs, prise en main). Support humain : postlyservice@gmail.com
              </p>
            )}
            {msgs.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  fontSize: "0.88rem",
                  lineHeight: 1.55,
                  background: m.role === "user" ? "rgba(124,92,252,0.35)" : "rgba(255,255,255,0.06)",
                  color: "var(--clr-text)",
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ color: "var(--clr-muted)", fontSize: "0.8rem", paddingLeft: 4 }}>Réponse en cours…</div>
            )}
            <div ref={endRef} />
          </div>
          {err && <div style={{ color: "#f87171", fontSize: "0.75rem", padding: "0 12px 4px" }}>{err}</div>}
          <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Votre question…"
              style={{
                flex: 1,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(17,17,24,0.9)",
                color: "var(--clr-text)",
                padding: "10px 12px",
                fontSize: "0.9rem",
              }}
            />
            <button
              type="button"
              onClick={send}
              disabled={loading}
              style={{
                borderRadius: 12,
                border: "none",
                padding: "0 16px",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                background: "linear-gradient(135deg,var(--clr-primary),#5B3EE8)",
                color: "#fff",
              }}
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          fontSize: "1.4rem",
          boxShadow: "0 8px 32px rgba(124,92,252,0.45)",
          background: "linear-gradient(135deg,var(--clr-primary),#5B3EE8)",
          color: "#fff",
          float: "right",
        }}
      >
        ✦
      </button>
    </div>
  );
}
