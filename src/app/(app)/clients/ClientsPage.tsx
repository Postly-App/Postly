"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, Edit2, Building2 } from "lucide-react"

type ClientRow = {
  id: string
  name: string
  brandColor: string | null
  logoUrl: string | null
  postCount: number
  socialCount: number
  createdAt: string
}

interface Props {
  teamName: string
  canManage: boolean
  clients: ClientRow[]
}

export default function ClientsPage({ teamName, canManage, clients }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [draftColor, setDraftColor] = useState("#7C5CFC")

  async function createClient(e: React.FormEvent) {
    e.preventDefault()
    if (!draftName.trim()) return
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draftName.trim(), brandColor: draftColor }),
    })
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      toast.error(j.error ?? "Erreur.")
      return
    }
    toast.success("Client créé.")
    setCreating(false)
    setDraftName("")
    setDraftColor("#7C5CFC")
    router.refresh()
  }

  async function updateClient(id: string) {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draftName.trim(), brandColor: draftColor }),
    })
    if (!res.ok) {
      toast.error("Erreur.")
      return
    }
    toast.success("Client mis à jour.")
    setEditingId(null)
    router.refresh()
  }

  async function deleteClient(id: string, name: string) {
    if (!confirm(`Supprimer le client ${name} ? Les posts et comptes liés perdront leur affectation (pas supprimés).`)) return
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("Erreur.")
      return
    }
    toast.success("Client supprimé.")
    router.refresh()
  }

  async function setActive(id: string | null) {
    const res = await fetch("/api/clients/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id }),
    })
    if (!res.ok) {
      toast.error("Erreur.")
      return
    }
    toast.success(id ? "Client actif" : "Mode tous les clients")
    router.refresh()
  }

  return (
    <div style={{ padding: "40px 32px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.8rem", marginBottom: 4 }}>{teamName}</p>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 800 }}>Clients</h1>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.85rem", marginTop: 4 }}>
            {clients.length} client{clients.length > 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setCreating(true)}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={16} /> Nouveau client
          </button>
        )}
      </div>

      {creating && canManage && (
        <form onSubmit={createClient} style={{
          background: "var(--clr-card)",
          border: "1px solid var(--clr-border)",
          borderRadius: 14,
          padding: 20,
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <input
            type="text"
            placeholder="Nom du client"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={100}
            required
            autoFocus
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--clr-muted)" }}>
              Couleur de marque :
            </label>
            <input
              type="color"
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
              style={{ width: 50, height: 36, borderRadius: 8, border: "1px solid var(--clr-border)", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "var(--clr-muted)" }}>
              {draftColor}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={primaryBtn}>Créer</button>
            <button type="button" onClick={() => setCreating(false)} style={ghostBtn}>Annuler</button>
          </div>
        </form>
      )}

      {clients.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 32px",
          background: "var(--surface-2)",
          border: "1px dashed var(--line-2)",
          borderRadius: 20,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(180deg, rgba(180,200,255,0.05), rgba(180,200,255,0.02))",
            border: "1px solid var(--line-2)",
            display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <Building2 size={24} strokeWidth={1.5} color="var(--text-3)" />
          </div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.01em" }}>Aucun client pour l&apos;instant</h2>
          <p style={{ color: "var(--text-3)", fontSize: "0.88rem", maxWidth: 380, margin: "0 auto", lineHeight: 1.55 }}>
            Crée ton premier client pour organiser tes posts, comptes sociaux et rapports
            par marque.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {clients.map((c) => (
            <div key={c.id} style={{
              background: "var(--clr-card)",
              border: "1px solid var(--clr-border)",
              borderRadius: 14,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: c.brandColor ?? "rgba(124,92,252,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, color: "#fff", fontSize: "1.1rem",
                }}>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === c.id ? (
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      style={{ ...inputStyle, padding: "4px 8px", fontSize: "0.95rem" }}
                      autoFocus
                    />
                  ) : (
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.name}</div>
                  )}
                  <div style={{ fontSize: "0.75rem", color: "var(--clr-muted)" }}>
                    {c.postCount} post{c.postCount > 1 ? "s" : ""} · {c.socialCount} compte{c.socialCount > 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {editingId === c.id ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={draftColor}
                    onChange={(e) => setDraftColor(e.target.value)}
                    style={{ width: 36, height: 32, borderRadius: 6, border: "1px solid var(--clr-border)", cursor: "pointer" }}
                  />
                  <button onClick={() => updateClient(c.id)} style={{ ...primaryBtn, padding: "6px 12px", fontSize: "0.8rem" }}>OK</button>
                  <button onClick={() => setEditingId(null)} style={{ ...ghostBtn, padding: "6px 12px", fontSize: "0.8rem" }}>Annuler</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setActive(c.id)}
                    style={{ ...ghostBtn, padding: "6px 12px", fontSize: "0.78rem", flex: 1 }}
                  >
                    Activer
                  </button>
                  {canManage && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(c.id)
                          setDraftName(c.name)
                          setDraftColor(c.brandColor ?? "#7C5CFC")
                        }}
                        style={{ ...ghostBtn, padding: "6px 10px", fontSize: "0.78rem" }}
                        aria-label="Modifier"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteClient(c.id, c.name)}
                        style={{ ...ghostBtn, padding: "6px 10px", fontSize: "0.78rem", color: "#FC5C7C" }}
                        aria-label="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {clients.length > 0 && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button onClick={() => setActive(null)} style={ghostBtn}>
            Mode &quot;Tous les clients&quot;
          </button>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--clr-border)",
  background: "var(--clr-bg)",
  color: "var(--clr-text)",
  fontSize: "0.95rem",
  fontFamily: "inherit",
}

const primaryBtn: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.85rem",
  cursor: "pointer",
}

const ghostBtn: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "1px solid var(--clr-border)",
  background: "transparent",
  color: "var(--clr-text)",
  fontSize: "0.85rem",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
}
