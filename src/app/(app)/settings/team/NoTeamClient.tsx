"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function NoTeamClient() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  async function createTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(j.error ?? "Impossible de créer l'équipe.")
        return
      }
      toast.success("Équipe créée !")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 60, maxWidth: 600, margin: "0 auto" }}>
      <div style={{
        background: "var(--clr-card)",
        border: "1px solid var(--clr-border)",
        borderRadius: 20,
        padding: 36,
        textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(124,92,252,0.15)", display: "inline-flex",
          alignItems: "center", justifyContent: "center", marginBottom: 20,
          fontSize: 28,
        }}>
          👥
        </div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 10 }}>
          Crée ton équipe
        </h1>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", marginBottom: 28, lineHeight: 1.6 }}>
          Donne un nom à ton agence. Tu pourras ensuite inviter jusqu&apos;à 5 collaborateurs et
          gérer plusieurs clients.
        </p>
        <form onSubmit={createTeam} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Ex : Mon Agence Marketing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            minLength={2}
            required
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid var(--clr-border)",
              background: "var(--clr-bg)",
              color: "var(--clr-text)",
              fontSize: "0.95rem",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: loading ? "rgba(124,92,252,0.5)" : "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: loading || !name.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Création..." : "Créer l'équipe"}
          </button>
        </form>
      </div>
    </div>
  )
}
