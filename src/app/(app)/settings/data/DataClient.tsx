"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Download, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Props {
  userEmail: string
}

export default function DataClient({ userEmail }: Props) {
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  async function exportData() {
    if (exporting) return
    setExporting(true)
    try {
      const res = await fetch("/api/user/export", { method: "GET" })
      if (!res.ok) {
        toast.error("Export impossible.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `postly-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Tes données ont été exportées.")
    } finally {
      setExporting(false)
    }
  }

  async function deleteAccount() {
    if (confirmText !== "SUPPRIMER") {
      toast.error("Tape exactement SUPPRIMER pour confirmer.")
      return
    }
    if (deleting) return
    if (!confirm("Confirmation finale : supprimer définitivement ton compte et toutes ses données ?")) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(j.error ?? "Suppression impossible.")
        return
      }
      toast.success("Compte supprimé.")
      // Déconnexion locale puis redirect
      await signOut({ callbackUrl: "/" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ padding: "40px 32px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.8rem", marginBottom: 4 }}>Réglages</p>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 800 }}>Mes données (RGPD)</h1>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", marginTop: 6 }}>
          Exerce tes droits d&apos;accès, de portabilité et d&apos;effacement.
        </p>
      </div>

      {/* Export */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(124,92,252,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Download size={18} color="#9B82FD" />
          </div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Exporter mes données</h2>
        </div>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 16 }}>
          Télécharge un fichier JSON contenant toutes tes données personnelles : profil, posts,
          comptes sociaux (sans jetons), abonnement, analytics, clés API et équipe.
        </p>
        <button
          onClick={exportData}
          disabled={exporting}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "1px solid var(--clr-border)",
            background: "var(--clr-card2)",
            color: "var(--clr-text)",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: exporting ? "not-allowed" : "pointer",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}
        >
          <Download size={14} /> {exporting ? "Préparation..." : "Télécharger mes données (.json)"}
        </button>
      </div>

      {/* Delete account */}
      <div style={{ ...cardStyle, borderColor: "rgba(252,92,124,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(252,92,124,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle size={18} color="#FC5C7C" />
          </div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#FC5C7C" }}>Supprimer mon compte</h2>
        </div>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 12 }}>
          Cette action est <strong>définitive et irréversible</strong>. Elle supprime :
        </p>
        <ul style={{ color: "var(--clr-muted)", fontSize: "0.85rem", lineHeight: 1.8, marginBottom: 16, paddingLeft: 18 }}>
          <li>Ton compte ({userEmail}) et tes informations de profil</li>
          <li>Tous tes posts, brouillons et planifications</li>
          <li>Tous tes comptes sociaux connectés et leurs jetons (chiffrés)</li>
          <li>Tes analytics, ton historique et tes clés API</li>
          <li>Ton équipe et ses clients si tu en es propriétaire</li>
          <li>Ton abonnement Stripe (annulé immédiatement)</li>
        </ul>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.8rem", marginBottom: 12 }}>
          Tape <code style={{ background: "var(--clr-bg)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>SUPPRIMER</code> ci-dessous pour confirmer :
        </p>
        <input
          type="text"
          placeholder="SUPPRIMER"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={deleting}
          style={{
            width: "100%",
            maxWidth: 280,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--clr-border)",
            background: "var(--clr-bg)",
            color: "var(--clr-text)",
            fontSize: "0.9rem",
            fontFamily: "monospace",
            marginBottom: 12,
            display: "block",
          }}
        />
        <button
          onClick={deleteAccount}
          disabled={deleting || confirmText !== "SUPPRIMER"}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: confirmText === "SUPPRIMER" && !deleting
              ? "linear-gradient(135deg,#FC5C7C,#E63B5F)"
              : "rgba(252,92,124,0.3)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: confirmText === "SUPPRIMER" && !deleting ? "pointer" : "not-allowed",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}
        >
          <Trash2 size={14} /> {deleting ? "Suppression..." : "Supprimer définitivement mon compte"}
        </button>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: "var(--clr-card)",
  border: "1px solid var(--clr-border)",
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
}
