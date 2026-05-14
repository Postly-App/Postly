"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Copy, Trash2, Mail, UserCircle } from "lucide-react"

type Member = {
  id: string
  userId: string
  name: string | null
  email: string
  image: string | null
  role: "OWNER" | "ADMIN" | "MEMBER"
  roleLabel: string
  joinedAt: string | null
}

type Invitation = {
  id: string
  email: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  roleLabel: string
  expiresAt: string
}

type Owner = {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Props {
  teamId: string
  teamName: string
  owner: Owner
  members: Member[]
  pendingInvitations: Invitation[]
  seatLimit: number
  currentSeatUsage: number
  canManage: boolean
  isOwner: boolean
}

export default function TeamClient({
  teamId,
  teamName,
  owner,
  members,
  pendingInvitations,
  seatLimit,
  currentSeatUsage,
  canManage,
  isOwner,
}: Props) {
  const router = useRouter()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER")
  const [inviting, setInviting] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(teamName)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim() || inviting) return
    setInviting(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const j = (await res.json().catch(() => ({}))) as { error?: string; inviteUrl?: string }
      if (!res.ok) {
        toast.error(j.error ?? "Impossible d'envoyer l'invitation.")
        return
      }
      if (j.inviteUrl) {
        await navigator.clipboard.writeText(j.inviteUrl).catch(() => {})
        toast.success(`Invitation créée. Lien copié dans le presse-papier.`)
      } else {
        toast.success("Invitation créée.")
      }
      setInviteEmail("")
      router.refresh()
    } finally {
      setInviting(false)
    }
  }

  async function revokeInvitation(invitationId: string) {
    if (!confirm("Révoquer cette invitation ?")) return
    const res = await fetch(`/api/teams/${teamId}/invitations`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    })
    if (!res.ok) {
      toast.error("Erreur lors de la révocation.")
      return
    }
    toast.success("Invitation révoquée.")
    router.refresh()
  }

  async function removeMember(memberId: string, memberName: string) {
    if (!confirm(`Retirer ${memberName} de l'équipe ?`)) return
    const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      toast.error("Erreur lors du retrait.")
      return
    }
    toast.success("Membre retiré.")
    router.refresh()
  }

  async function changeRole(memberId: string, newRole: "ADMIN" | "MEMBER") {
    const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    if (!res.ok) {
      toast.error("Erreur lors du changement de rôle.")
      return
    }
    toast.success("Rôle mis à jour.")
    router.refresh()
  }

  async function saveName() {
    if (name.trim().length < 2) return
    const res = await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
    if (!res.ok) {
      toast.error("Erreur.")
      return
    }
    setEditingName(false)
    toast.success("Nom mis à jour.")
    router.refresh()
  }

  function copyInviteUrl() {
    toast.info("Pour récupérer le lien, révoque puis recrée l'invitation.")
  }

  const seatsRemaining = Math.max(0, seatLimit - currentSeatUsage)

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.8rem", marginBottom: 4 }}>Réglages</p>
        {editingName ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              style={{
                fontSize: "1.6rem", fontWeight: 800,
                padding: "6px 12px", borderRadius: 8,
                border: "1px solid var(--clr-border)",
                background: "var(--clr-bg)", color: "var(--clr-text)",
              }}
            />
            <button onClick={saveName} style={primaryBtn}>OK</button>
            <button onClick={() => { setEditingName(false); setName(teamName); }} style={ghostBtn}>Annuler</button>
          </div>
        ) : (
          <h1 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 12 }}>
            {teamName}
            {canManage && (
              <button onClick={() => setEditingName(true)} style={ghostBtnSmall}>Renommer</button>
            )}
          </h1>
        )}
        <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", marginTop: 6 }}>
          {currentSeatUsage}/{seatLimit} sièges utilisés · {seatsRemaining} disponible{seatsRemaining > 1 ? "s" : ""}
        </p>
      </div>

      {/* OWNER card */}
      <div style={cardStyle}>
        <h2 style={cardTitle}>Propriétaire</h2>
        <MemberRow
          name={owner.name}
          email={owner.email}
          image={owner.image}
          roleLabel="Propriétaire"
          actions={null}
        />
      </div>

      {/* MEMBERS */}
      <div style={cardStyle}>
        <h2 style={cardTitle}>
          Membres <span style={{ color: "var(--clr-muted)", fontWeight: 400, fontSize: "0.85rem" }}>({members.length})</span>
        </h2>
        {members.length === 0 ? (
          <p style={{ color: "var(--clr-muted)", fontSize: "0.85rem" }}>Aucun membre. Invite quelqu&apos;un ci-dessous.</p>
        ) : (
          members.map((m) => (
            <MemberRow
              key={m.id}
              name={m.name}
              email={m.email}
              image={m.image}
              roleLabel={m.roleLabel}
              actions={canManage ? (
                <>
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value as "ADMIN" | "MEMBER")}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--clr-border)",
                      background: "var(--clr-bg)",
                      color: "var(--clr-text)",
                      fontSize: "0.8rem",
                    }}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Membre</option>
                  </select>
                  <button
                    onClick={() => removeMember(m.id, m.name ?? m.email)}
                    aria-label="Retirer"
                    style={{ ...ghostBtnSmall, color: "#FC5C7C" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : null}
            />
          ))
        )}
      </div>

      {/* INVITATIONS */}
      {pendingInvitations.length > 0 && (
        <div style={cardStyle}>
          <h2 style={cardTitle}>Invitations en attente <span style={{ color: "var(--clr-muted)", fontWeight: 400, fontSize: "0.85rem" }}>({pendingInvitations.length})</span></h2>
          {pendingInvitations.map((inv) => (
            <div key={inv.id} style={rowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "rgba(124,92,252,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Mail size={18} color="#9B82FD" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{inv.email}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--clr-muted)" }}>
                    {inv.roleLabel} · expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>
              {canManage && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => copyInviteUrl()}
                    aria-label="Lien d'invitation"
                    style={ghostBtnSmall}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => revokeInvitation(inv.id)}
                    aria-label="Révoquer"
                    style={{ ...ghostBtnSmall, color: "#FC5C7C" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* INVITE FORM */}
      {canManage && seatsRemaining > 0 && (
        <div style={cardStyle}>
          <h2 style={cardTitle}>Inviter un membre</h2>
          <form onSubmit={invite} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
            <input
              type="email"
              placeholder="email@exemple.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              disabled={inviting}
              style={{
                flex: "1 1 240px",
                padding: "11px 14px",
                borderRadius: 10,
                border: "1px solid var(--clr-border)",
                background: "var(--clr-bg)",
                color: "var(--clr-text)",
                fontSize: "0.9rem",
              }}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
              disabled={inviting}
              style={{
                padding: "11px 14px",
                borderRadius: 10,
                border: "1px solid var(--clr-border)",
                background: "var(--clr-bg)",
                color: "var(--clr-text)",
                fontSize: "0.9rem",
              }}
            >
              <option value="MEMBER">Membre</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              style={{ ...primaryBtn, padding: "11px 22px" }}
            >
              {inviting ? "Envoi..." : "Inviter"}
            </button>
          </form>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.75rem", marginTop: 12 }}>
            Le lien d&apos;invitation sera copié automatiquement dans ton presse-papier.
            Tu peux le partager par email, Slack, etc.
          </p>
        </div>
      )}

      {isOwner && (
        <div style={{ ...cardStyle, borderColor: "rgba(252,92,124,0.3)" }}>
          <h2 style={{ ...cardTitle, color: "#FC5C7C" }}>Zone de danger</h2>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.85rem", marginBottom: 12 }}>
            Supprimer l&apos;équipe supprimera tous les membres, invitations et clients associés.
            Action irréversible.
          </p>
          <button
            onClick={async () => {
              if (!confirm("Supprimer définitivement l'équipe ?")) return
              const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" })
              if (!res.ok) { toast.error("Erreur."); return }
              toast.success("Équipe supprimée.")
              router.push("/settings")
              router.refresh()
            }}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid rgba(252,92,124,0.4)",
              background: "transparent",
              color: "#FC5C7C",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Supprimer l&apos;équipe
          </button>
        </div>
      )}
    </div>
  )
}

function MemberRow({
  name, email, image, roleLabel, actions,
}: {
  name: string | null
  email: string
  image: string | null
  roleLabel: string
  actions: React.ReactNode
}) {
  return (
    <div style={rowStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" width={38} height={38} style={{ borderRadius: "50%" }} />
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(124,92,252,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <UserCircle size={22} color="#9B82FD" />
          </div>
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{name ?? email}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--clr-muted)" }}>
            {email} · {roleLabel}
          </div>
        </div>
      </div>
      {actions && <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{actions}</div>}
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

const cardTitle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  marginBottom: 16,
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid var(--clr-border)",
  gap: 12,
}

const primaryBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.85rem",
  cursor: "pointer",
}

const ghostBtn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 10,
  border: "1px solid var(--clr-border)",
  background: "transparent",
  color: "var(--clr-text)",
  fontSize: "0.85rem",
  cursor: "pointer",
}

const ghostBtnSmall: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid var(--clr-border)",
  background: "transparent",
  color: "var(--clr-muted)",
  fontSize: "0.75rem",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
}
