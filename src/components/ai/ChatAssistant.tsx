"use client";

import { useCallback, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";

type Role = "user" | "assistant";

interface Msg {
  role: Role;
  content: string;
}

interface Props {
  /** Si false, l’API renverra 503 : on affiche un bandeau sans bloquer l’UI. */
  enabled: boolean;
}

export default function ChatAssistant({ enabled }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const send = useCallback(async () => {
    const text = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
    if (!text || loading) return;
    if (text.length > 4000) {
      toast.error("Message trop long (max 4000 caractères).");
      return;
    }

    const userMsg: Msg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    scrollToBottom();

    if (!enabled) {
      setMessages((h) => [
        ...h,
        {
          role: "assistant",
          content:
            "L’assistant n’est pas encore configuré sur ce serveur (clé OpenAI manquante). Ajoute OPENAI_API_KEY aux variables d’environnement puis redémarre l’app.",
        },
      ]);
      setLoading(false);
      scrollToBottom();
      return;
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, stream: true }),
      });

      if (res.status === 429) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Limite atteinte.");
        setMessages((h) => h.slice(0, -1));
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Erreur assistant.");
        setMessages((h) => h.slice(0, -1));
        setLoading(false);
        return;
      }

      if (!res.body) {
        toast.error("Réponse vide.");
        setMessages((h) => h.slice(0, -1));
        setLoading(false);
        return;
      }

      setMessages((h) => [...h, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((h) => {
          const copy = [...h];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
        scrollToBottom();
      }

      if (!acc.trim()) {
        setMessages((h) => {
          const copy = [...h];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "(Réponse vide — réessaie ou reformule.)",
          };
          return copy;
        });
      }
    } catch {
      toast.error("Connexion interrompue.");
      setMessages((h) => {
        if (h.length >= 2 && h[h.length - 1].role === "user") {
          return h.slice(0, -1);
        }
        return h;
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [enabled, input, loading, messages]);

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir l’assistant Postly"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 60,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid rgba(124,92,252,0.35)",
          background: "linear-gradient(135deg, rgba(124,92,252,0.95), rgba(99,102,241,0.95))",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MessageCircle size={26} strokeWidth={2} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal
          aria-label="Assistant Postly"
          style={{
            position: "fixed",
            right: 20,
            bottom: 92,
            zIndex: 61,
            width: "min(400px, calc(100vw - 40px))",
            height: "min(520px, calc(100vh - 140px))",
            background: "var(--clr-card)",
            border: "1px solid var(--clr-border)",
            borderRadius: 20,
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--clr-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background: "rgba(124,92,252,0.08)",
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>Assistant Postly</div>
              <div style={{ fontSize: "0.72rem", color: "var(--clr-muted)", marginTop: 2 }}>
                {enabled ? "Contexte compte & posts inclus" : "Mode démo — clé API manquante"}
              </div>
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--clr-muted)",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.length === 0 && (
              <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", lineHeight: 1.5, margin: 0 }}>
                Pose une question sur tes posts, demande des idées de contenu ou un coup de main pour rédiger.
                Ton plan, tes réseaux connectés et tes derniers posts sont pris en compte côté serveur (sans exposer
                de secrets).
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "92%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  fontSize: "0.84rem",
                  lineHeight: 1.45,
                  whiteSpace: "pre-wrap",
                  background: m.role === "user" ? "rgba(124,92,252,0.22)" : "var(--clr-bg)",
                  border: `1px solid ${m.role === "user" ? "rgba(124,92,252,0.25)" : "var(--clr-border)"}`,
                  color: "var(--clr-text)",
                }}
              >
                {m.content || (loading && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: 12, borderTop: "1px solid var(--clr-border)", display: "flex", gap: 8 }}>
            <textarea
              rows={2}
              value={input}
              disabled={loading}
              placeholder="Écris ton message…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              style={{
                flex: 1,
                resize: "none",
                borderRadius: 12,
                border: "1px solid var(--clr-border)",
                padding: "10px 12px",
                fontSize: "0.85rem",
                fontFamily: "inherit",
                background: "var(--clr-bg)",
                color: "var(--clr-text)",
              }}
            />
            <button
              type="button"
              disabled={loading || !input.trim()}
              onClick={() => void send()}
              aria-label="Envoyer"
              style={{
                width: 48,
                borderRadius: 12,
                border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, rgba(124,92,252,0.95), rgba(99,102,241,0.95))",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              {loading ? <span style={{ fontSize: "1rem" }}>⏳</span> : <Send size={20} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
