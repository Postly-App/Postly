"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, Copy, Key, AlertTriangle } from "lucide-react"

type ApiKeyRow = {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface Props {
  keys: ApiKeyRow[]
}

export default function ApiKeysClient({ keys }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [expiresInDays, setExpiresInDays] = useState<string>("90")
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!draftName.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName.trim(),
          expiresInDays: expiresInDays === "never" ? null : Number(expiresInDays),
        }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; key?: string; name?: string }
      if (!res.ok) {
        toast.error(j.error ?? "Erreur.")
        return
      }
      if (j.key) {
        setNewKey({ key: j.key, name: j.name ?? draftName })
        await navigator.clipboard.writeText(j.key).catch(() => {})
        toast.success("Clé copiée dans le presse-papier.")
      }
      setCreating(false)
      setDraftName("")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  async function revoke(id: string, name: string) {
    if (!confirm(`Révoquer la clé "${name}" ? Toutes les intégrations utilisant cette clé cesseront de fonctionner.`)) return
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("Erreur.")
      return
    }
    toast.success("Clé révoquée.")
    router.refresh()
  }

  return (
    <div style={{ padding: "40px 32px", maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.8rem", marginBottom: 4 }}>Réglages</p>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 800 }}>Clés API</h1>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", marginTop: 6 }}>
          Génère des clés Bearer pour appeler l&apos;API publique <code style={{ fontFamily: "monospace", fontSize: "0.85em" }}>/api/v1/*</code>.
        </p>
      </div>

      {newKey && (
        <div style={{
          background: "rgba(34,211,160,0.08)",
          border: "1px solid rgba(34,211,160,0.4)",
          borderRadius: 14,
          padding: 20,
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={18} color="#22D3A0" />
            <strong style={{ fontSize: "0.9rem" }}>Clé créée : {newKey.name}</strong>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginBottom: 12, lineHeight: 1.5 }}>
            <strong>Copie cette clé maintenant.</strong> Pour des raisons de sécurité, elle ne sera plus jamais affichée.
          </p>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: 12,
            background: "var(--clr-bg)",
            borderRadius: 10,
            border: "1px solid var(--clr-border)",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            wordBreak: "break-all",
          }}>
            <code style={{ flex: 1 }}>{newKey.key}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey.key).catch(() => {})
                toast.success("Copié.")
              }}
              style={{
                padding: "6px 10px", borderRadius: 8,
                background: "rgba(124,92,252,0.15)", border: "none",
                color: "#9B82FD", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
                fontSize: "0.78rem",
              }}
            >
              <Copy size={13} /> Copier
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            style={{
              marginTop: 12,
              padding: "8px 16px", borderRadius: 10,
              border: "1px solid var(--clr-border)", background: "transparent",
              color: "var(--clr-text)", fontSize: "0.82rem", cursor: "pointer",
            }}
          >
            J&apos;ai copié la clé
          </button>
        </div>
      )}

      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          style={{
            padding: "10px 18px", borderRadius: 10,
            border: "none", background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
            color: "#fff", fontWeight: 700, fontSize: "0.9rem",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            marginBottom: 20,
          }}
        >
          <Plus size={16} /> Nouvelle clé API
        </button>
      ) : (
        <form onSubmit={create} style={{
          background: "var(--clr-card)", border: "1px solid var(--clr-border)",
          borderRadius: 14, padding: 20, marginBottom: 20,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <input
            type="text"
            placeholder="Nom (ex: Zapier, Production, Script Marketing)"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={80}
            required
            autoFocus
            style={{
              padding: "10px 14px", borderRadius: 10,
              border: "1px solid var(--clr-border)", background: "var(--clr-bg)",
              color: "var(--clr-text)", fontSize: "0.9rem",
            }}
          />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--clr-muted)" }}>Expiration :</label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              style={{
                padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--clr-border)", background: "var(--clr-bg)",
                color: "var(--clr-text)", fontSize: "0.9rem",
              }}
            >
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
              <option value="365">1 an</option>
              <option value="never">Jamais</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={submitting} style={{
              padding: "10px 18px", borderRadius: 10,
              border: "none", background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
              color: "#fff", fontWeight: 700, fontSize: "0.9rem",
              cursor: submitting ? "not-allowed" : "pointer",
            }}>
              {submitting ? "Génération..." : "Générer la clé"}
            </button>
            <button type="button" onClick={() => setCreating(false)} style={{
              padding: "10px 18px", borderRadius: 10,
              border: "1px solid var(--clr-border)", background: "transparent",
              color: "var(--clr-text)", fontSize: "0.9rem", cursor: "pointer",
            }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {keys.length === 0 ? (
        <div style={{
          background: "var(--clr-card)", border: "1px dashed var(--clr-border)",
          borderRadius: 16, padding: 40, textAlign: "center",
        }}>
          <Key size={28} color="#9B99B5" style={{ marginBottom: 8 }} />
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>
            Aucune clé API
          </h2>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.85rem" }}>
            Crée ta première clé pour commencer à intégrer Postly.
          </p>
        </div>
      ) : (
        <div style={{
          background: "var(--clr-card)", border: "1px solid var(--clr-border)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {keys.map((k, i) => (
            <div key={k.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "16px 20px",
              borderBottom: i < keys.length - 1 ? "1px solid var(--clr-border)" : "none",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "rgba(124,92,252,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Key size={16} color="#9B82FD" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{k.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--clr-muted)", fontFamily: "monospace" }}>
                  {k.prefix}…
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--clr-muted)", marginTop: 4 }}>
                  {k.lastUsedAt
                    ? `Utilisée le ${new Date(k.lastUsedAt).toLocaleDateString("fr-FR")}`
                    : "Jamais utilisée"}
                  {k.expiresAt
                    ? ` · expire le ${new Date(k.expiresAt).toLocaleDateString("fr-FR")}`
                    : " · pas d'expiration"}
                </div>
              </div>
              <button
                onClick={() => revoke(k.id, k.name)}
                aria-label="Révoquer"
                style={{
                  padding: "8px 10px", borderRadius: 8,
                  border: "1px solid var(--clr-border)", background: "transparent",
                  color: "#FC5C7C", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: "0.8rem",
                }}
              >
                <Trash2 size={13} /> Révoquer
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: 24,
        padding: 20,
        background: "var(--clr-card)",
        border: "1px solid var(--clr-border)",
        borderRadius: 14,
      }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>📖 Utilisation rapide</h3>
        <pre style={{
          background: "var(--clr-bg)",
          border: "1px solid var(--clr-border)",
          borderRadius: 8,
          padding: 12,
          fontSize: "0.78rem",
          overflow: "auto",
          fontFamily: "monospace",
          lineHeight: 1.5,
        }}>
{`# Lister les posts
curl https://www.getpostly.space/api/v1/posts \\
  -H "Authorization: Bearer pk_..."

# Créer un post
curl -X POST https://www.getpostly.space/api/v1/posts \\
  -H "Authorization: Bearer pk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Mon premier post via API",
    "platforms": ["TWITTER", "FACEBOOK"],
    "scheduledAt": "2026-06-01T18:00:00Z"
  }'`}
        </pre>
      </div>
    </div>
  )
}
