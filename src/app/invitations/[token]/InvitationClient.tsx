"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { CheckCircle2, AlertTriangle, Users } from "lucide-react"

interface Props {
  token: string
  teamName: string | null
  invitationEmail: string | null
  inviteRole: "OWNER" | "ADMIN" | "MEMBER" | null
  expired: boolean
  wrongAccount: boolean
  authenticated: boolean
  currentEmail: string | null
}

export default function InvitationClient({
  token,
  teamName,
  invitationEmail,
  inviteRole,
  expired,
  wrongAccount,
  authenticated,
  currentEmail,
}: Props) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)

  if (expired) {
    return (
      <>
        <AlertTriangle size={40} color="#FC5C7C" style={{ marginBottom: 16 }} />
        <h1 style={titleStyle}>Invitation invalide</h1>
        <p style={descStyle}>
          Cette invitation a expiré ou n&apos;existe pas. Demande à l&apos;administrateur de l&apos;équipe
          de t&apos;en envoyer une nouvelle.
        </p>
        <Link href="/login" style={linkBtn}>Retour à l&apos;accueil</Link>
      </>
    )
  }

  if (wrongAccount) {
    return (
      <>
        <AlertTriangle size={40} color="#F6B73C" style={{ marginBottom: 16 }} />
        <h1 style={titleStyle}>Mauvais compte</h1>
        <p style={descStyle}>
          Cette invitation est destinée à <strong>{invitationEmail}</strong>.<br />
          Tu es connecté avec <strong>{currentEmail}</strong>.
        </p>
        <p style={{ ...descStyle, fontSize: "0.85rem", marginTop: 16 }}>
          Déconnecte-toi et reconnecte-toi avec le bon email.
        </p>
        <Link href="/api/auth/signout" style={linkBtn}>Se déconnecter</Link>
      </>
    )
  }

  if (!authenticated) {
    return (
      <>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(124,92,252,0.15)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <Users size={26} color="#9B82FD" />
        </div>
        <h1 style={titleStyle}>Tu es invité chez {teamName}</h1>
        <p style={descStyle}>
          Connecte-toi (ou inscris-toi) avec <strong>{invitationEmail}</strong> pour rejoindre
          l&apos;équipe en tant que <strong>{roleLabel(inviteRole)}</strong>.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/invitations/${token}`)}`}
            style={primaryBtn}
          >
            Se connecter
          </Link>
          <Link
            href={`/signup?email=${encodeURIComponent(invitationEmail ?? "")}&callbackUrl=${encodeURIComponent(`/invitations/${token}`)}`}
            style={linkBtn}
          >
            Créer un compte
          </Link>
        </div>
      </>
    )
  }

  async function accept() {
    if (accepting) return
    setAccepting(true)
    try {
      const res = await fetch(`/api/invitations/${token}`, { method: "POST" })
      const j = (await res.json().catch(() => ({}))) as { error?: string; teamId?: string }
      if (!res.ok) {
        toast.error(j.error ?? "Impossible d'accepter l'invitation.")
        return
      }
      toast.success(`Bienvenue chez ${teamName} !`)
      router.push("/dashboard")
      router.refresh()
    } finally {
      setAccepting(false)
    }
  }

  return (
    <>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "rgba(34,211,160,0.15)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16,
      }}>
        <CheckCircle2 size={26} color="#22D3A0" />
      </div>
      <h1 style={titleStyle}>Rejoindre {teamName}</h1>
      <p style={descStyle}>
        Tu es sur le point de rejoindre l&apos;équipe en tant que <strong>{roleLabel(inviteRole)}</strong>.
      </p>
      <button
        onClick={accept}
        disabled={accepting}
        style={{ ...primaryBtn, marginTop: 20, width: "100%" }}
      >
        {accepting ? "Acceptation..." : "Accepter l'invitation"}
      </button>
      <Link href="/dashboard" style={{ ...linkBtn, marginTop: 8, display: "block" }}>
        Plus tard
      </Link>
    </>
  )
}

function roleLabel(r: "OWNER" | "ADMIN" | "MEMBER" | null): string {
  if (r === "ADMIN") return "Admin"
  if (r === "OWNER") return "Propriétaire"
  return "Membre"
}

const titleStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  fontWeight: 800,
  marginBottom: 10,
}

const descStyle: React.CSSProperties = {
  color: "var(--clr-muted)",
  fontSize: "0.9rem",
  lineHeight: 1.6,
  marginBottom: 8,
}

const primaryBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 24px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.9rem",
  cursor: "pointer",
  textDecoration: "none",
}

const linkBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 24px",
  borderRadius: 10,
  border: "1px solid var(--clr-border)",
  background: "transparent",
  color: "var(--clr-text)",
  fontWeight: 600,
  fontSize: "0.9rem",
  textDecoration: "none",
}
