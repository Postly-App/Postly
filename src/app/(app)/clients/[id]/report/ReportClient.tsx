"use client"

import { useState } from "react"
import Link from "next/link"
import { Printer, Calendar } from "lucide-react"

interface Props {
  client: {
    id: string
    name: string
    brandColor: string | null
    logoUrl: string | null
  }
  teamName: string
  days: number
  generatedAt: string
  totals: { reach: number; views: number; likes: number; comments: number; shares: number }
  postsCount: number
  posts: Array<{ id: string; content: string; platforms: string[]; publishedAt: string | null }>
  byPlatform: Array<{ platform: string; reach: number; engagement: number }>
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".", ",")}K`
  return n.toLocaleString("fr-FR")
}

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  TWITTER: "Twitter/X",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  THREADS: "Threads",
  PINTEREST: "Pinterest",
}

export default function ReportClient({ client, teamName, days, generatedAt, totals, postsCount, posts, byPlatform }: Props) {
  const [days_, setDays] = useState(days)
  const brand = client.brandColor ?? "#7C5CFC"
  const engagementBase = totals.reach || totals.views
  const engagementRate = engagementBase > 0
    ? ((totals.likes + totals.comments + totals.shares) / engagementBase) * 100
    : 0

  const maxReach = Math.max(1, ...byPlatform.map((b) => b.reach))

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .report-page { background: white !important; color: #1a1a1a !important; }
          .report-card { background: white !important; border-color: #e5e5e5 !important; box-shadow: none !important; }
          .report-muted { color: #6b6b6b !important; }
        }
      `}</style>

      {/* Toolbar (non imprimée) */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--clr-bg)",
        borderBottom: "1px solid var(--clr-border)",
        padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href={`/clients`} style={{ fontSize: "0.85rem", color: "var(--clr-muted)", textDecoration: "none" }}>
            ← Tous les clients
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}>
            <Calendar size={14} />
            <select
              value={days_}
              onChange={(e) => {
                setDays(Number(e.target.value))
                window.location.href = `?days=${e.target.value}`
              }}
              style={{
                padding: "6px 10px", borderRadius: 8,
                border: "1px solid var(--clr-border)",
                background: "var(--clr-card)", color: "var(--clr-text)",
                fontSize: "0.85rem",
              }}
            >
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
              <option value="365">1 an</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: brand,
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <Printer size={16} /> Exporter en PDF
        </button>
      </div>

      <div className="report-page" style={{
        maxWidth: 900, margin: "0 auto", padding: "40px 32px",
        background: "var(--clr-bg)",
      }}>
        {/* Header brand */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingBottom: 24,
          borderBottom: `3px solid ${brand}`,
          marginBottom: 32,
          flexWrap: "wrap", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {client.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.logoUrl} alt={client.name} style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 60, height: 60, borderRadius: 12,
                background: brand,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: "#fff", fontSize: "1.5rem",
              }}>
                {client.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
                Rapport de performance — {client.name}
              </h1>
              <p className="report-muted" style={{ color: "var(--clr-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                Période : {days_} derniers jours · Généré le {new Date(generatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="report-muted" style={{ fontSize: "0.75rem", color: "var(--clr-muted)" }}>Préparé par</p>
            <p style={{ fontSize: "0.95rem", fontWeight: 700 }}>{teamName}</p>
          </div>
        </div>

        {/* KPIs */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 16,
          marginBottom: 32,
        }}>
          {[
            { label: "Posts publiés", value: postsCount.toString() },
            { label: "Portée", value: fmt(totals.reach) },
            { label: "Impressions", value: fmt(totals.views) },
            { label: "Engagement", value: `${engagementRate.toFixed(1).replace(".", ",")}%` },
            { label: "Likes", value: fmt(totals.likes) },
            { label: "Commentaires", value: fmt(totals.comments) },
          ].map((s) => (
            <div key={s.label} className="report-card" style={{
              background: "var(--clr-card)",
              border: "1px solid var(--clr-border)",
              borderRadius: 12,
              padding: 18,
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: brand, letterSpacing: "-0.5px" }}>
                {s.value}
              </div>
              <div className="report-muted" style={{ fontSize: "0.78rem", color: "var(--clr-muted)", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Platform breakdown */}
        {byPlatform.length > 0 && (
          <div className="report-card" style={{
            background: "var(--clr-card)",
            border: "1px solid var(--clr-border)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>
              Répartition par plateforme
            </h2>
            {byPlatform.map((p) => (
              <div key={p.platform} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(p.reach)} portée · {fmt(p.engagement)} interactions</span>
                </div>
                <div style={{ height: 8, background: "rgba(0,0,0,0.05)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    width: `${(p.reach / maxReach) * 100}%`,
                    height: "100%",
                    background: brand,
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <div className="report-card" style={{
            background: "var(--clr-card)",
            border: "1px solid var(--clr-border)",
            borderRadius: 12,
            padding: 24,
          }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>
              Posts publiés ({posts.length})
            </h2>
            {posts.slice(0, 20).map((p) => (
              <div key={p.id} style={{
                paddingTop: 12, paddingBottom: 12,
                borderTop: "1px solid var(--clr-border)",
              }}>
                <div className="report-muted" style={{ fontSize: "0.75rem", color: "var(--clr-muted)", marginBottom: 4 }}>
                  {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("fr-FR") : "—"}
                  {" · "}
                  {p.platforms.map((pl) => PLATFORM_LABELS[pl] ?? pl).join(", ")}
                </div>
                <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                  {p.content}{p.content.length === 200 ? "…" : ""}
                </div>
              </div>
            ))}
            {posts.length > 20 && (
              <p className="report-muted" style={{ fontSize: "0.75rem", color: "var(--clr-muted)", marginTop: 12, textAlign: "center" }}>
                + {posts.length - 20} autres posts
              </p>
            )}
          </div>
        )}

        {posts.length === 0 && (
          <div style={{
            padding: 40, textAlign: "center",
            background: "var(--clr-card)",
            border: "1px dashed var(--clr-border)",
            borderRadius: 12,
          }}>
            <p style={{ color: "var(--clr-muted)" }}>Aucune publication sur la période sélectionnée.</p>
          </div>
        )}

        <div style={{
          marginTop: 40, paddingTop: 16,
          borderTop: "1px solid var(--clr-border)",
          textAlign: "center",
        }}>
          <p className="report-muted" style={{ fontSize: "0.72rem", color: "var(--clr-muted)" }}>
            Rapport généré par <strong>{teamName}</strong> via Postly · Confidentiel
          </p>
        </div>
      </div>
    </>
  )
}
