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
  PROCESSING:{ label: "En cours",  color: "#FCD34D", bg: "rgba(252,211,77,0.12)" },
  FAILED:    { label: "Échec",     color: "#FC5C7C", bg: "rgba(252,92,124,0.12)" },
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HEAT_HOURS = [6, 9, 12, 15, 18, 21]; // colonnes affichées (économise l'espace)

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(".", ",")}K`;
  return n.toString();
}

function timeAgo(date: Date | string): string {
  const t = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60)  return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} h`;
  return `${Math.floor(h / 24)} j`;
}

function formatRelativeFuture(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = t - Date.now();
  if (diff < 0) return "passé";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `dans ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `dans ${h} h`;
  const d = Math.floor(h / 24);
  return `dans ${d} j`;
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}h`;
}

// JS Date.getDay() returns 0=Sun..6=Sat. We want 0=Mon..6=Sun (the heatmap visual order).
const DAY_REORDER = [1, 2, 3, 4, 5, 6, 0]; // Lun, Mar, Mer, Jeu, Ven, Sam, Dim

interface UpcomingPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledAt: string;
}

interface ActivityPost {
  id: string;
  status: string;
  platforms: string[];
  content: string;
  createdAt: string;
  publishedAt: string | null;
  scheduledAt: string | null;
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
  plan: "FREE" | "PRO" | "AGENCY";
  heatmap: number[][]; // [day 0..6 Sun..Sat][hour 0..23] reach cumulé
  bestSlots: Array<{ weekday: number; hour: number; reach: number }>;
  topPlatforms: Array<{ platform: string; reach: number }>;
  hasAnalytics: boolean;
  upcoming: UpcomingPost[];
  activity: ActivityPost[];
}

export default function DashboardClient({
  analytics,
  recentPosts,
  connectedAccounts,
  user,
  aiChatEnabled,
  plan,
  heatmap,
  bestSlots,
  topPlatforms,
  hasAnalytics,
  upcoming,
  activity,
}: Props) {
  const firstName = user.name?.split(" ")[0] ?? "toi";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Bonjour" : hour < 17 ? "Bon après-midi" : "Bonsoir";

  const hasReach        = analytics.totalReach > 0;
  const hasEngagement   = analytics.avgEngagementRate > 0;
  const hasInteractions = (analytics.totalLikes + analytics.totalComments) > 0;
  const hasPublished    = analytics.publishedPosts > 0;
  const hasConnected    = connectedAccounts.length > 0;
  const hasAnyPost      = recentPosts.length > 0;

  // Onboarding step (only shows when user is missing fundamental setup)
  const onboardingActive = !hasConnected || !hasAnyPost;
  const onboardingSteps = [
    {
      done: hasConnected,
      title: "Connecte ton premier réseau social",
      desc: "Choisis parmi Instagram, TikTok, LinkedIn, Twitter, YouTube, Facebook ou Threads.",
      cta: "Aller aux comptes",
      href: "/settings",
    },
    {
      done: hasAnyPost,
      title: "Crée ton premier post",
      desc: "L'IA peut t'aider à rédiger une légende adaptée à la plateforme.",
      cta: "Ouvrir le Studio",
      href: "/compose",
    },
    {
      done: hasPublished,
      title: "Publie ou planifie",
      desc: "Tes analytics et la heatmap apparaîtront après la première publication.",
      cta: hasAnyPost ? "Programmer un post" : "Tout vient à point",
      href: "/compose",
    },
  ];
  const completedSteps = onboardingSteps.filter((s) => s.done).length;

  const statCards = [
    {
      icon: "👁️",
      value: hasReach ? fmt(analytics.totalReach) : "—",
      label: "Portée totale",
      hint: hasReach ? "30 derniers jours" : "Données dès la 1ʳᵉ publication",
      color: "var(--clr-primary-h)",
    },
    {
      icon: "💬",
      value: hasEngagement ? `${analytics.avgEngagementRate.toFixed(1).replace(".", ",")}%` : "—",
      label: "Taux d'engagement",
      hint: hasEngagement ? "Likes + commentaires / portée" : "Données dès la 1ʳᵉ publication",
      color: "var(--clr-green)",
    },
    {
      icon: "📝",
      value: hasPublished ? analytics.publishedPosts.toString() : "0",
      label: "Posts publiés",
      hint: hasPublished ? `${analytics.scheduledPosts} planifié${analytics.scheduledPosts > 1 ? "s" : ""}` : "Aucun ce mois-ci",
      color: "var(--clr-text)",
    },
    {
      icon: "👥",
      value: hasInteractions ? fmt(analytics.totalLikes + analytics.totalComments) : "—",
      label: "Interactions",
      hint: hasInteractions ? "Likes + commentaires" : "Données dès la 1ʳᵉ publication",
      color: "var(--clr-text)",
    },
  ];

  // Heatmap normalization
  const heatmapMax = Math.max(0, ...heatmap.flat());
  const heatColor = (val: number): string => {
    if (heatmapMax === 0 || val === 0) return "rgba(124,92,252,0.06)";
    const t = Math.min(val / heatmapMax, 1);
    const alpha = 0.15 + t * 0.70;
    return `rgba(124,92,252,${alpha.toFixed(3)})`;
  };

  return (
    <div style={{
      padding: 28,
      minHeight: "calc(100vh - 64px)",
      position: "relative",
      zIndex: 1, // au-dessus de .app-ambient
    }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.55rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
            {greeting}, {firstName} 👋
          </h1>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.86rem", marginTop: 4 }}>
            {hasAnalytics
              ? `Aperçu de tes 30 derniers jours${analytics.scheduledPosts > 0 ? ` · ${analytics.scheduledPosts} post${analytics.scheduledPosts > 1 ? "s" : ""} planifié${analytics.scheduledPosts > 1 ? "s" : ""}` : ""}`
              : "Bienvenue sur Postly — voici ton terrain de jeu social."}
          </p>
        </div>
        <Link href="/compose" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 12,
          background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)", color: "#fff",
          fontSize: "0.86rem", fontWeight: 600,
          boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 22px -6px rgba(79,70,229,0.55)",
          textDecoration: "none",
          letterSpacing: "-0.005em",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouveau post
        </Link>
      </div>

      {/* ── Onboarding (only if user hasn't connected/posted yet) ── */}
      {onboardingActive && (
        <div style={{
          background: "var(--clr-card)",
          border: "1px solid var(--clr-border)",
          borderRadius: 16, padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--clr-primary-h)", letterSpacing: "1px", textTransform: "uppercase" }}>Onboarding</div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginTop: 4 }}>3 étapes pour démarrer</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.78rem", color: "var(--clr-muted)", fontVariantNumeric: "tabular-nums" }}>
                {completedSteps} / {onboardingSteps.length}
              </span>
              <div style={{ width: 88, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(completedSteps / onboardingSteps.length) * 100}%`,
                  background: "linear-gradient(90deg, #7C5CFC, #22D3A0)",
                  transition: "width 240ms ease",
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {onboardingSteps.map((step, i) => (
              <div key={i} style={{
                position: "relative",
                padding: "14px 14px 14px 44px",
                borderRadius: 12,
                background: step.done ? "rgba(34,211,160,0.06)" : "rgba(255,255,255,0.02)",
                border: step.done ? "1px solid rgba(34,211,160,0.20)" : "1px solid var(--clr-border)",
              }}>
                <div style={{
                  position: "absolute", left: 14, top: 14,
                  width: 20, height: 20, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: step.done ? "rgba(34,211,160,0.20)" : "rgba(124,92,252,0.14)",
                  border: step.done ? "1px solid rgba(34,211,160,0.45)" : "1px solid rgba(124,92,252,0.35)",
                  fontSize: "0.7rem", fontWeight: 800,
                  color: step.done ? "#22D3A0" : "var(--clr-primary-h)",
                }}>
                  {step.done ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--clr-muted)", lineHeight: 1.5, marginBottom: 8 }}>
                  {step.desc}
                </div>
                {!step.done && (
                  <Link href={step.href} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: "0.76rem", fontWeight: 600,
                    color: "var(--clr-primary-h)",
                    textDecoration: "none",
                  }}>
                    {step.cta} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: "var(--clr-card)",
            border: "1px solid var(--clr-border)",
            borderRadius: 14, padding: 18,
            position: "relative", overflow: "hidden",
            transition: "border-color 180ms ease, transform 180ms ease",
          }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,92,252,0.30)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--clr-border)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(124,92,252,0.10)",
                border: "1px solid rgba(124,92,252,0.20)",
                fontSize: "0.95rem",
              }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: "1.55rem", fontWeight: 800, letterSpacing: "-0.6px", color: s.color, fontVariantNumeric: "tabular-nums" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--clr-muted)", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: "0.7rem", marginTop: 6, color: "var(--clr-muted)", opacity: 0.65 }}>{s.hint}</div>
          </div>
        ))}
      </div>

      {/* ── Heatmap + Posts à venir ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 20 }} className="dash-row">
        {/* Heatmap réelle */}
        <div style={{
          background: "var(--clr-card)", border: "1px solid var(--clr-border)",
          borderRadius: 14, padding: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
            <div>
              <h2 style={{ fontSize: "0.92rem", fontWeight: 700 }}>Meilleurs créneaux de publication</h2>
              <p style={{ fontSize: "0.74rem", color: "var(--clr-muted)", marginTop: 3 }}>
                Reach cumulé par jour × heure (30 derniers jours)
              </p>
            </div>
            {hasAnalytics && bestSlots.length > 0 && (
              <span style={{
                fontSize: "0.68rem", fontWeight: 700,
                padding: "3px 9px", borderRadius: 99,
                background: "rgba(34,211,160,0.14)",
                border: "1px solid rgba(34,211,160,0.30)",
                color: "#22D3A0",
                whiteSpace: "nowrap",
              }}>
                ✓ Données réelles
              </span>
            )}
          </div>

          {/* Grid: row=jour, col=heure (subset) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `42px repeat(${HEAT_HOURS.length}, 1fr)`,
            gap: 4,
            opacity: hasAnalytics ? 1 : 0.55,
          }}>
            {/* Header row */}
            <div />
            {HEAT_HOURS.map((h) => (
              <div key={h} style={{
                fontSize: "0.68rem", fontVariantNumeric: "tabular-nums",
                color: "var(--clr-muted)", textAlign: "center", paddingBottom: 4,
              }}>
                {formatHour(h)}
              </div>
            ))}

            {/* Body rows */}
            {DAY_REORDER.map((dayIdx, rowIdx) => (
              <div key={dayIdx} style={{ display: "contents" }}>
                <div style={{
                  fontSize: "0.7rem", fontWeight: 600, color: "var(--clr-muted)",
                  display: "flex", alignItems: "center", height: 28,
                }}>
                  {WEEKDAYS[rowIdx]}
                </div>
                {HEAT_HOURS.map((h) => {
                  const val = heatmap[dayIdx]?.[h] ?? 0;
                  const isBest = bestSlots.some((s) => s.weekday === dayIdx && s.hour === h);
                  return (
                    <div
                      key={`${dayIdx}-${h}`}
                      title={hasAnalytics ? `${WEEKDAYS[rowIdx]} ${formatHour(h)} · reach ${fmt(val)}` : "Pas encore de données"}
                      style={{
                        height: 28, borderRadius: 6,
                        background: heatColor(val),
                        border: isBest ? "1px solid rgba(34,211,160,0.55)" : "1px solid rgba(255,255,255,0.02)",
                        boxShadow: isBest ? "0 0 12px rgba(34,211,160,0.40)" : "none",
                        transition: "transform 120ms ease",
                        cursor: hasAnalytics ? "default" : "default",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer : top slots OR call to action */}
          {hasAnalytics && bestSlots.length > 0 ? (
            <div style={{
              marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--clr-border)",
              display: "flex", flexWrap: "wrap", gap: 8,
            }}>
              {bestSlots.map((s, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 10px", borderRadius: 999,
                  background: "rgba(34,211,160,0.08)",
                  border: "1px solid rgba(34,211,160,0.25)",
                  fontSize: "0.74rem", fontWeight: 600,
                  color: "#22D3A0",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22D3A0" }} />
                  {WEEKDAYS[DAY_REORDER.indexOf(s.weekday)] ?? WEEKDAYS[0]} {formatHour(s.hour)}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ marginTop: 14, fontSize: "0.74rem", color: "var(--clr-muted)", lineHeight: 1.55 }}>
              Les meilleurs créneaux apparaîtront automatiquement dès que tu auras publié et que les analytics auront été collectées (généralement 24-48h après chaque publication).
            </p>
          )}
        </div>

        {/* Posts à venir */}
        <div style={{
          background: "var(--clr-card)", border: "1px solid var(--clr-border)",
          borderRadius: 14, padding: 20, display: "flex", flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: "0.92rem", fontWeight: 700 }}>Posts planifiés</h2>
            <Link href="/compose" style={{
              fontSize: "0.76rem", color: "var(--clr-primary-h)", fontWeight: 600,
              textDecoration: "none",
            }}>+ Planifier</Link>
          </div>

          {upcoming.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px 8px" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(124,92,252,0.10)",
                border: "1px solid rgba(124,92,252,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
              }}>📅</div>
              <p style={{ fontSize: "0.84rem", fontWeight: 600 }}>Rien de planifié</p>
              <p style={{ color: "var(--clr-muted)", fontSize: "0.74rem", marginTop: 6, lineHeight: 1.55, maxWidth: 240 }}>
                Programme un post depuis le Studio pour ne plus jamais oublier de publier.
              </p>
              <Link href="/compose" style={{
                marginTop: 14,
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: "0.78rem", fontWeight: 600,
                color: "var(--clr-primary-h)",
                textDecoration: "none",
              }}>
                Planifier mon 1ᵉʳ post →
              </Link>
            </div>
          ) : (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, padding: 0, margin: 0 }}>
              {upcoming.slice(0, 5).map((p) => {
                const pfCfg = PLATFORM_CONFIG[p.platforms[0] ?? "INSTAGRAM"] ?? { label: p.platforms[0], bg: "#333" };
                return (
                  <li key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--clr-border)",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: pfCfg.bg,
                    }}><SocialIcon platform={p.platforms[0] ?? "INSTAGRAM"} size={14} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.78rem", fontWeight: 500,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{p.content || "(sans titre)"}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--clr-muted)", marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
                        {formatDateLong(p.scheduledAt)} · {formatRelativeFuture(p.scheduledAt)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Activity feed + Top platforms ────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 20 }} className="dash-row">
        {/* Activity */}
        <div style={{
          background: "var(--clr-card)", border: "1px solid var(--clr-border)",
          borderRadius: 14, padding: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: "0.92rem", fontWeight: 700 }}>Activité récente</h2>
            <span style={{ fontSize: "0.72rem", color: "var(--clr-muted)" }}>10 dernières actions</span>
          </div>

          {activity.length === 0 ? (
            <div style={{ padding: "30px 8px", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>📡</div>
              <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)" }}>
                Aucune activité encore. Tes actions s&apos;afficheront ici.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
              {activity.map((a, i) => {
                const st = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.DRAFT;
                const eventDate = a.publishedAt ?? a.scheduledAt ?? a.createdAt;
                const eventLabel =
                  a.status === "PUBLISHED" ? "Publié" :
                  a.status === "SCHEDULED" ? "Planifié" :
                  a.status === "FAILED"    ? "Échec de publication" :
                  a.status === "PROCESSING"? "Publication en cours" :
                  "Brouillon créé";
                return (
                  <li key={a.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "11px 0",
                    borderBottom: i < activity.length - 1 ? "1px solid var(--clr-border)" : "none",
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                      background: st.color,
                      boxShadow: `0 0 8px ${st.color}80`,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{eventLabel}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--clr-muted)" }}>
                          {a.platforms.length > 0 ? `· ${a.platforms.join(", ")}` : ""}
                        </span>
                      </div>
                      <div style={{
                        fontSize: "0.76rem", color: "var(--clr-muted)", marginTop: 2,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        maxWidth: "100%",
                      }}>
                        {a.content || "(sans contenu)"}
                      </div>
                    </div>
                    <span style={{
                      fontSize: "0.7rem", color: "var(--clr-muted)", whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {timeAgo(eventDate)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Top platforms */}
        <div style={{
          background: "var(--clr-card)", border: "1px solid var(--clr-border)",
          borderRadius: 14, padding: 20,
        }}>
          <h2 style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: 14 }}>Top plateformes (reach 30j)</h2>

          {topPlatforms.length === 0 ? (
            <div style={{ padding: "30px 4px", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>📊</div>
              <p style={{ fontSize: "0.78rem", color: "var(--clr-muted)", lineHeight: 1.55 }}>
                Le classement s&apos;affichera après ta 1ʳᵉ publication avec analytics.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {topPlatforms.map((p) => {
                const max = topPlatforms[0]?.reach ?? 0;
                const pct = max > 0 ? Math.max(4, Math.round((p.reach / max) * 100)) : 0;
                const cfg = PLATFORM_CONFIG[p.platform] ?? { label: p.platform, bg: "#666" };
                return (
                  <li key={p.platform}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: cfg.bg, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <SocialIcon platform={p.platform} size={12} />
                        </div>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{cfg.label}</span>
                      </div>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(p.reach)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: "linear-gradient(90deg, #7C5CFC, #22D3A0)",
                      }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Connected accounts ───────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: "0.92rem", fontWeight: 700 }}>Comptes connectés</h2>
          <Link href="/settings" style={{ fontSize: "0.76rem", color: "var(--clr-primary-h)", fontWeight: 600, textDecoration: "none" }}>
            + Connecter
          </Link>
        </div>

        {connectedAccounts.length === 0 ? (
          <div style={{
            background: "var(--clr-card)", border: "1px dashed var(--clr-border2)",
            borderRadius: 14, padding: "24px 18px", textAlign: "center",
          }}>
            <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>🔗</div>
            <p style={{ color: "var(--clr-text)", fontSize: "0.86rem", fontWeight: 600, marginBottom: 4 }}>
              Aucun réseau social connecté
            </p>
            <p style={{ color: "var(--clr-muted)", fontSize: "0.76rem", lineHeight: 1.55, marginBottom: 12 }}>
              Connecte ton premier compte pour publier et suivre tes performances.
            </p>
            <Link href="/settings" style={{
              display: "inline-block",
              padding: "8px 16px", borderRadius: 10,
              background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
              color: "#fff", fontSize: "0.78rem", fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 16px -6px rgba(79,70,229,0.45)",
            }}>
              Aller aux paramètres →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {connectedAccounts.map((acc) => {
              const cfg = PLATFORM_CONFIG[acc.platform] ?? { label: acc.platform, bg: "#333" };
              return (
                <div key={`${acc.platform}-${acc.accountId}`} style={{
                  background: "var(--clr-card)", border: "1px solid var(--clr-border)",
                  borderRadius: 12, padding: 14,
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "border-color 180ms ease",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,92,252,0.30)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--clr-border)"; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: cfg.bg,
                  }}><SocialIcon platform={acc.platform} size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{cfg.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--clr-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.accountName}</div>
                  </div>
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#22D3A0",
                    boxShadow: "0 0 6px #22D3A0",
                    flexShrink: 0,
                  }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ChatAssistant enabled={aiChatEnabled} plan={plan} />

      <style jsx>{`
        @media (max-width: 1100px) {
          :global(.dash-row) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
