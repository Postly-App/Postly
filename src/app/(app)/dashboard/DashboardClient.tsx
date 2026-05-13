"use client";

import Link from "next/link";
import SocialIcon from "@/components/SocialIcon";
import ChatAssistant from "@/components/ai/ChatAssistant";

const PLATFORM_CONFIG: Record<string, { label: string; bg: string }> = {
  INSTAGRAM: { label: "Instagram",  bg: "linear-gradient(135deg,#E1306C,#833AB4)" },
  TIKTOK:    { label: "TikTok",     bg: "#000" },
  TWITTER:   { label: "Twitter/X",  bg: "#1DA1F2" },
  LINKEDIN:  { label: "LinkedIn",   bg: "#0A66C2" },
  YOUTUBE:   { label: "YouTube",    bg: "#FF0000" },
  FACEBOOK:  { label: "Facebook",   bg: "#1877F2" },
  THREADS:   { label: "Threads",    bg: "#333" },
};

const STATUS_CONFIG = {
  PUBLISHED: { label: "Publié",    color: "#22D3A0", bg: "rgba(34,211,160,0.12)" },
  SCHEDULED: { label: "Planifié",  color: "#9B82FD", bg: "rgba(124,92,252,0.15)" },
  DRAFT:     { label: "Brouillon", color: "#9B99B5", bg: "rgba(155,153,181,0.1)" },
  FAILED:    { label: "Échec",     color: "#FC5C7C", bg: "rgba(252,92,124,0.12)" },
};

const HM_HOURS = ["9h","12h","15h","18h","20h","21h","22h"];
const HM_DAYS  = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(".", ",")}K`;
  return n.toString();
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60)  return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

interface Props {
  analytics: {
    totalReach: number;
    avgEngagementRate: number;
    scheduledPosts: number;
    publishedPosts: number;
    totalLikes: number;
    totalComments: number;
  };
  recentPosts: Array<{
    id: string;
    content: string;
    platforms: string[];
    status: string;
    scheduledAt: Date | null;
    createdAt: Date;
  }>;
  connectedAccounts: Array<{
    platform: string;
    accountName: string;
    accountId: string;
  }>;
  user: { name?: string | null; email?: string | null; image?: string | null };
  aiChatEnabled: boolean;
}

export default function DashboardClient({ analytics, recentPosts, connectedAccounts, user, aiChatEnabled }: Props) {
  const firstName = user.name?.split(" ")[0] ?? "toi";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Bonjour" : hour < 17 ? "Bon après-midi" : "Bonsoir";

  const hasReach        = analytics.totalReach > 0;
  const hasEngagement   = analytics.avgEngagementRate > 0;
  const hasFollowers    = (analytics.totalLikes + analytics.totalComments) > 0;
  const hasPublished    = analytics.publishedPosts > 0;

  const statCards = [
    {
      icon: "👁️",
      value: hasReach ? fmt(analytics.totalReach) : "—",
      label: "Portée totale",
      hint: hasReach ? "30 derniers jours" : "Bientôt disponible",
      color: "var(--clr-primary-h)",
    },
    {
      icon: "💬",
      value: hasEngagement ? `${analytics.avgEngagementRate.toFixed(1).replace(".", ",")}%` : "—",
      label: "Taux d'engagement",
      hint: hasEngagement ? "30 derniers jours" : "Bientôt disponible",
      color: "var(--clr-green)",
    },
    {
      icon: "📝",
      value: hasPublished ? analytics.publishedPosts.toString() : "0",
      label: "Posts publiés",
      hint: hasPublished ? "30 derniers jours" : "Aucun ce mois-ci",
      color: "var(--clr-text)",
    },
    {
      icon: "👥",
      value: hasFollowers ? fmt(analytics.totalLikes + analytics.totalComments) : "—",
      label: "Interactions",
      hint: hasFollowers ? "Likes + commentaires" : "Bientôt disponible",
      color: "var(--clr-text)",
    },
  ];

  return (
    <div style={{ padding: 32, background: "var(--clr-bg)", minHeight: "calc(100vh - 64px)" }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
            {greeting}, {firstName} 👋
          </h1>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.875rem", marginTop: 4 }}>
            Voici un résumé de vos performances des 30 derniers jours.
            {analytics.scheduledPosts > 0 && ` · ${analytics.scheduledPosts} post${analytics.scheduledPosts > 1 ? "s" : ""} planifié${analytics.scheduledPosts > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/compose" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 22px", borderRadius: 16,
          background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)", color: "#fff",
          fontSize: "0.875rem", fontWeight: 600,
          boxShadow: "0 0 24px rgba(124,92,252,0.4)", transition: "var(--transition)",
          textDecoration: "none",
        }}>✏️ Nouveau post</Link>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: "var(--clr-card)", border: "1px solid var(--clr-border)",
            borderRadius: 16, padding: 24, transition: "var(--transition)",
            position: "relative", overflow: "hidden",
          }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,92,252,0.25)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-glow)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--clr-border)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
          >
            <div aria-hidden="true" style={{
              position: "absolute", top: 0, right: 0,
              width: 80, height: 80, borderRadius: "50%",
              background: "radial-gradient(circle,rgba(124,92,252,0.1),transparent)",
            }} />
            <div style={{ fontSize: "1.4rem", marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-1px", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--clr-muted)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            <div style={{
              fontSize: "0.75rem", fontWeight: 500,
              marginTop: 8, color: "var(--clr-muted)", opacity: 0.75,
            }}>{s.hint}</div>
          </div>
        ))}
      </div>

      {/* ── Widgets row ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Posts à venir */}
        <div style={{ background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Posts à venir</h2>
            <Link href="/compose" style={{ fontSize: "0.8rem", color: "var(--clr-primary-h)", fontWeight: 600, textDecoration: "none" }}>+ Ajouter</Link>
          </div>

          {recentPosts.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✍️</div>
              <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", marginBottom: 4 }}>Aucun post pour l&apos;instant</p>
              <p style={{ color: "var(--clr-muted)", fontSize: "0.8rem", opacity: 0.7, marginBottom: 16 }}>Crée ton premier post et commence à grandir</p>
              <Link href="/compose" style={{ fontSize: "0.82rem", color: "var(--clr-primary-h)", fontWeight: 600, textDecoration: "none" }}>
                Créer mon premier post →
              </Link>
            </div>
          ) : (
            <ul style={{ listStyle: "none" }}>
              {recentPosts.slice(0, 5).map((p, i) => {
                const st = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.DRAFT;
                const pfCfg = PLATFORM_CONFIG[p.platforms[0] as keyof typeof PLATFORM_CONFIG];
                const slice = recentPosts.slice(0, 5);
                return (
                  <li key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 0",
                    borderBottom: i < slice.length - 1 ? "1px solid var(--clr-border)" : "none",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: pfCfg?.bg ?? "#333",
                    }}><SocialIcon platform={p.platforms[0] ?? "INSTAGRAM"} size={18} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.content}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--clr-muted)", marginTop: 3 }}>
                        {p.scheduledAt ? `Planifié · ${timeAgo(p.scheduledAt)}` : timeAgo(p.createdAt)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                      whiteSpace: "nowrap", color: st.color, background: st.bg,
                    }}>{st.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Heatmap placeholder */}
        <div style={{ background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Meilleur moment</h2>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: "rgba(124,92,252,0.15)", color: "var(--clr-primary-h)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Bientôt
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "40px repeat(7,1fr)", gap: 4, opacity: 0.35, filter: "grayscale(0.4)" }} aria-hidden="true">
            <div style={{ display: "grid", gridTemplateRows: "24px repeat(7,1fr)", gap: 4 }}>
              <div />
              {HM_DAYS.map((d) => (
                <div key={d} style={{ fontSize: "0.65rem", color: "var(--clr-muted)", display: "flex", alignItems: "center", height: 28 }}>{d}</div>
              ))}
            </div>
            {HM_HOURS.map((h) => (
              <div key={h} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: "0.65rem", color: "var(--clr-muted)", textAlign: "center", height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>{h}</div>
                {Array.from({ length: 7 }).map((_, ri) => (
                  <div key={ri} className="hm-1" style={{ height: 28, borderRadius: 4 }} />
                ))}
              </div>
            ))}
          </div>

          <p style={{ marginTop: 14, fontSize: "0.72rem", color: "var(--clr-muted)", lineHeight: 1.6 }}>
            La heatmap des meilleurs créneaux apparaîtra dès que vous aurez publié quelques posts via Postly.
          </p>
        </div>
      </div>

      {/* ── Connected accounts ───────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Comptes connectés</h2>
          <Link href="/settings" style={{ fontSize: "0.8rem", color: "var(--clr-primary-h)", fontWeight: 600, textDecoration: "none" }}>
            + Connecter un compte
          </Link>
        </div>

        {connectedAccounts.length === 0 ? (
          <div style={{
            background: "var(--clr-card)", border: "1px dashed var(--clr-border)",
            borderRadius: 16, padding: "32px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔗</div>
            <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", marginBottom: 4 }}>
              Aucun réseau social connecté
            </p>
            <p style={{ color: "var(--clr-muted)", fontSize: "0.8rem", opacity: 0.7, marginBottom: 14 }}>
              Connectez vos comptes depuis les paramètres pour commencer à publier.
            </p>
            <Link href="/settings" style={{ fontSize: "0.82rem", color: "var(--clr-primary-h)", fontWeight: 600, textDecoration: "none" }}>
              Aller aux paramètres →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {connectedAccounts.map((acc) => {
              const cfg = PLATFORM_CONFIG[acc.platform] ?? { label: acc.platform, bg: "#333" };
              return (
                <div key={`${acc.platform}-${acc.accountId}`} style={{
                  background: "var(--clr-card)", border: "1px solid var(--clr-border)",
                  borderRadius: 16, padding: 20,
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "var(--transition)",
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,92,252,0.25)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--clr-border)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: cfg.bg,
                  }}><SocialIcon platform={acc.platform} size={22} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{cfg.label}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--clr-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.accountName}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 700, marginTop: 4, color: "var(--clr-green)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", display: "inline-block" }} />
                      Connecté
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ChatAssistant enabled={aiChatEnabled} />
    </div>
  );
}
