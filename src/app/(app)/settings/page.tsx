"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import SocialIcon from "@/components/SocialIcon";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "FACEBOOK",  label: "Facebook",   color: "#1877F2", bg: "rgba(24,119,242,0.12)",  desc: "Posts sur pages et groupes" },
  { id: "INSTAGRAM", label: "Instagram",  color: "#E1306C", bg: "rgba(225,48,108,0.12)",  desc: "Publie photos, reels et stories" },
  { id: "YOUTUBE",   label: "YouTube",    color: "#FF0000", bg: "rgba(255,0,0,0.1)",      desc: "Shorts et vidéos longues" },
  { id: "LINKEDIN",  label: "LinkedIn",   color: "#0A66C2", bg: "rgba(10,102,194,0.12)",  desc: "Posts professionnels et articles" },
  { id: "TWITTER",   label: "Twitter / X", color: "#1DA1F2", bg: "rgba(29,161,242,0.12)",  desc: "Tweets, threads et médias" },
  { id: "THREADS",   label: "Threads",    color: "#9B99B5", bg: "rgba(255,255,255,0.06)", desc: "Posts courts et fils de discussion" },
  { id: "PINTEREST", label: "Pinterest",  color: "#BD081C", bg: "rgba(189,8,28,0.12)",   desc: "Épingles et tableaux" },
  { id: "TIKTOK",    label: "TikTok",     color: "#69C9D0", bg: "rgba(105,201,208,0.12)", desc: "Vidéos et posts texte" },
];

const TABS = ["Profil", "Compte", "Notifications", "Sécurité", "Comptes"] as const;
type Tab = (typeof TABS)[number];
type NotifKey = "posts" | "weekly" | "engagement" | "news" | "tips";

const NOTIF_ITEMS: { key: NotifKey; title: string; desc: string }[] = [
  { key: "posts",      title: "Posts publiés",       desc: "Recevoir une notification à chaque publication" },
  { key: "weekly",     title: "Résumé hebdomadaire", desc: "Rapport de performance chaque lundi matin" },
  { key: "engagement", title: "Pic d'engagement",    desc: "Alertes quand un post performe exceptionnellement" },
  { key: "news",       title: "Nouveautés produit",  desc: "Annonces de nouvelles fonctionnalités" },
  { key: "tips",       title: "Conseils marketing",  desc: "Astuces et bonnes pratiques par email" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab]   = useState<Tab>("Profil");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    posts: true, weekly: true, engagement: true, news: false, tips: false,
  });

  const firstNameRef   = useRef<HTMLInputElement>(null);
  const lastNameRef    = useRef<HTMLInputElement>(null);
  const oldPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPassRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ok = p.get("social_connected");
    const err = p.get("social_error");
    if (ok) {
      toast.success(`Réseau ${ok} connecté.`);
      window.history.replaceState({}, "", "/settings");
    }
    if (err) {
      toast.error(`Connexion réseau : ${decodeURIComponent(err)}`);
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    const slug = platformId.toLowerCase();
    window.location.href = `/api/auth/${slug}/connect`;
  };

  const handleSaveProfile = async () => {
    const name = `${firstNameRef.current?.value ?? ""} ${lastNameRef.current?.value ?? ""}`.trim();
    if (!name) { toast.error("Le nom est requis."); return; }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success("Profil mis à jour !");
    } catch { toast.error("Erreur réseau."); }
    finally { setSavingProfile(false); }
  };

  const handleSavePassword = async () => {
    const oldPassword = oldPasswordRef.current?.value ?? "";
    const newPassword = newPasswordRef.current?.value ?? "";
    const confirmPass = confirmPassRef.current?.value ?? "";
    if (!oldPassword || !newPassword || !confirmPass) { toast.error("Tous les champs sont requis."); return; }
    if (newPassword !== confirmPass) { toast.error("Les mots de passe ne correspondent pas."); return; }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success("Mot de passe mis à jour !");
      if (oldPasswordRef.current) oldPasswordRef.current.value = "";
      if (newPasswordRef.current) newPasswordRef.current.value = "";
      if (confirmPassRef.current) confirmPassRef.current.value = "";
    } catch { toast.error("Erreur réseau."); }
    finally { setSavingPassword(false); }
  };

  const handleSaveNotifs = () => {
    try {
      localStorage.setItem("postly_notifs", JSON.stringify(notifs));
      toast.success("Préférences de notification enregistrées !");
    } catch { toast.error("Impossible de sauvegarder."); }
  };

  const firstName = session?.user?.name?.split(" ")[0] ?? "";
  const lastName  = session?.user?.name?.split(" ").slice(1).join(" ") ?? "";

  const cardStyle: React.CSSProperties = {
    background: "var(--clr-card)", border: "1px solid var(--clr-border)",
    borderRadius: 16, padding: 28, marginBottom: 20,
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "0.8rem", fontWeight: 600,
    marginBottom: 8, color: "var(--clr-muted)",
  };
  const btnPrimary: React.CSSProperties = {
    padding: "9px 20px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
    color: "#fff", fontSize: "0.875rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "var(--font)",
    boxShadow: "0 0 16px rgba(124,92,252,0.35)",
  };
  const btnDanger: React.CSSProperties = {
    padding: "7px 16px", borderRadius: 10, fontSize: "0.82rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)",
    border: "1px solid rgba(252,92,124,0.3)",
    background: "transparent", color: "var(--clr-danger)",
  };

  return (
    <div style={{ padding: 32, maxWidth: 960, marginLeft: "auto", marginRight: "auto" }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Paramètres</h1>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.875rem", marginTop: 4 }}>
          Gérez vos préférences et informations de compte
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 4, flexWrap: "wrap",
        background: "var(--clr-card)", border: "1px solid var(--clr-border)",
        borderRadius: 12, padding: 4, marginBottom: 28, width: "fit-content",
      }} role="tablist">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} role="tab" aria-selected={activeTab === tab}
            style={{
              padding: "9px 18px", borderRadius: 10, border: "none",
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
              background: activeTab === tab ? "rgba(124,92,252,0.15)" : "transparent",
              color: activeTab === tab ? "var(--clr-primary-h)" : "var(--clr-muted)",
              transition: "var(--transition)", fontFamily: "var(--font)",
            }}
          >{tab}</button>
        ))}
      </div>

      {/* ── PROFIL ────────────────────────────────────────── */}
      {activeTab === "Profil" && (
        <>
          <div style={cardStyle}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6 }}>Avatar</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginBottom: 20 }}>
              Votre avatar est généré à partir de l&apos;initiale de votre nom. L&apos;upload personnalisé arrive bientôt.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#7C5CFC,#F06292)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", fontWeight: 800, color: "#fff",
              }}>
                {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6 }}>Informations personnelles</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginBottom: 20 }}>Mettez à jour vos informations de base.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div><label style={lbl}>Prénom</label><input ref={firstNameRef} className="form-input" type="text" defaultValue={firstName} autoComplete="given-name" placeholder="Sophie" /></div>
              <div><label style={lbl}>Nom</label><input ref={lastNameRef} className="form-input" type="text" defaultValue={lastName} autoComplete="family-name" placeholder="Martin" /></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Email</label>
              <input className="form-input" type="email" defaultValue={session?.user?.email ?? ""} autoComplete="email" disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
            </div>
            <button onClick={handleSaveProfile} disabled={savingProfile} style={{ ...btnPrimary, opacity: savingProfile ? 0.6 : 1, cursor: savingProfile ? "not-allowed" : "pointer" }}>
              {savingProfile ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        </>
      )}

      {/* ── COMPTE ────────────────────────────────────────── */}
      {activeTab === "Compte" && (
        <>
          <div style={cardStyle}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6 }}>Préférences du compte</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginBottom: 20 }}>Personnalisez votre expérience Postly.</p>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Langue</label>
              <select className="form-input" defaultValue="fr">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Fuseau horaire</label>
              <select className="form-input">
                <option>Europe/Paris (UTC+1)</option>
                <option>Europe/London (UTC+0)</option>
                <option>America/New_York (UTC-5)</option>
              </select>
            </div>
            <button onClick={() => toast.success("Préférences enregistrées !")} style={btnPrimary}>Enregistrer</button>
          </div>

          <div style={{ ...cardStyle, borderColor: "rgba(252,92,124,0.25)" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6, color: "var(--clr-danger)" }}>Déconnexion</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginBottom: 20 }}>
              Pour supprimer définitivement votre compte et vos données, contactez{" "}
              <a href="mailto:contact@postly.app" style={{ color: "var(--clr-primary-h)", fontWeight: 600 }}>contact@postly.app</a>{" "}
              (RGPD — délai 30 jours).
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => signOut({ callbackUrl: "/" })} style={btnDanger}>Se déconnecter</button>
            </div>
          </div>
        </>
      )}

      {/* ── NOTIFICATIONS ─────────────────────────────────── */}
      {activeTab === "Notifications" && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6 }}>Préférences de notification</h3>
          <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginBottom: 20 }}>
            Choisissez quand et comment vous souhaitez être notifié.
          </p>
          {NOTIF_ITEMS.map((item, idx) => (
            <div key={item.key} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0",
              borderBottom: idx < NOTIF_ITEMS.length - 1 ? "1px solid var(--clr-border)" : "none",
            }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--clr-muted)", marginTop: 3 }}>{item.desc}</div>
              </div>
              <div
                onClick={() => setNotifs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                role="switch" aria-checked={notifs[item.key]}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: notifs[item.key] ? "var(--clr-primary)" : "rgba(255,255,255,0.1)",
                  cursor: "pointer", position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                  left: notifs[item.key] ? 23 : 3, background: "#fff", transition: "left 0.2s",
                }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20 }}>
            <button onClick={handleSaveNotifs} style={btnPrimary}>Enregistrer les préférences</button>
          </div>
        </div>
      )}

      {/* ── SÉCURITÉ ──────────────────────────────────────── */}
      {activeTab === "Sécurité" && (
        <>
          <div style={cardStyle}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6 }}>Changer le mot de passe</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginBottom: 20 }}>
              Utilisez un mot de passe fort d&apos;au moins 12 caractères.
            </p>
            <div style={{ marginBottom: 16 }}><label style={lbl}>Mot de passe actuel</label><input ref={oldPasswordRef} className="form-input" type="password" placeholder="••••••••" autoComplete="current-password" /></div>
            <div style={{ marginBottom: 16 }}><label style={lbl}>Nouveau mot de passe</label><input ref={newPasswordRef} className="form-input" type="password" placeholder="Min. 12 caractères" autoComplete="new-password" /></div>
            <div style={{ marginBottom: 20 }}><label style={lbl}>Confirmer le mot de passe</label><input ref={confirmPassRef} className="form-input" type="password" placeholder="••••••••" autoComplete="new-password" /></div>
            <button onClick={handleSavePassword} disabled={savingPassword} style={{ ...btnPrimary, opacity: savingPassword ? 0.6 : 1, cursor: savingPassword ? "not-allowed" : "pointer" }}>
              {savingPassword ? "Mise à jour…" : "Mettre à jour"}
            </button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6 }}>Double authentification (2FA)</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginBottom: 20 }}>
              Ajoutez une couche de sécurité supplémentaire à votre compte.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--clr-muted)" }}>
                Statut : <strong style={{ color: "var(--clr-danger)" }}>Non activé</strong>
              </span>
              <button onClick={() => toast.info("Double authentification bientôt disponible")} style={btnPrimary}>Activer la 2FA</button>
            </div>
          </div>
        </>
      )}

      {/* ── COMPTES ───────────────────────────────────────── */}
      {activeTab === "Comptes" && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6 }}>Réseaux sociaux connectés</h3>
          <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginBottom: 20 }}>
            Connectez vos plateformes pour publier et suivre vos contenus depuis Postly.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PLATFORMS.map((platform) => (
              <div key={platform.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 12, border: "1px solid var(--clr-border)",
                transition: "border-color 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,92,252,0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--clr-border)"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: platform.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <SocialIcon platform={platform.id} size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{platform.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--clr-muted)", marginTop: 2 }}>{platform.desc}</div>
                </div>
                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={connecting === platform.id}
                  style={{
                    padding: "7px 18px", borderRadius: 10, flexShrink: 0,
                    border: `1px solid ${platform.color}50`,
                    background: platform.bg, color: platform.color,
                    fontSize: "0.78rem", fontWeight: 700, fontFamily: "var(--font)",
                    cursor: connecting === platform.id ? "not-allowed" : "pointer",
                    opacity: connecting === platform.id ? 0.6 : 1,
                    transition: "var(--transition)",
                  }}
                >
                  {connecting === platform.id ? "Connexion…" : "Connecter"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
