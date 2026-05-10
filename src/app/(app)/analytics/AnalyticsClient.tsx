"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SocialIcon from "@/components/SocialIcon";

type Row = {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  recordedAt: string;
};

const PERIODS = [
  { id: "7", label: "7j" },
  { id: "30", label: "30j" },
  { id: "90", label: "90j" },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

const PLATFORM_META: Record<string, { label: string; bar: string }> = {
  INSTAGRAM: { label: "Instagram",  bar: "linear-gradient(90deg,#E1306C,#833AB4)" },
  TIKTOK:    { label: "TikTok",     bar: "#000" },
  LINKEDIN:  { label: "LinkedIn",   bar: "#0A66C2" },
  TWITTER:   { label: "X / Twitter",bar: "#1DA1F2" },
  FACEBOOK:  { label: "Facebook",   bar: "#1877F2" },
  YOUTUBE:   { label: "YouTube",    bar: "#FF0000" },
  THREADS:   { label: "Threads",    bar: "#9B99B5" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(".", ",")}K`;
  return n.toLocaleString("fr-FR");
}

interface Props {
  rows: Row[];
  publishedCount: number;
}

export default function AnalyticsClient({ rows, publishedCount }: Props) {
  const [period, setPeriod] = useState<PeriodId>("30");

  const filteredRows = useMemo(() => {
    const days = parseInt(period, 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return rows.filter((r) => new Date(r.recordedAt).getTime() >= cutoff);
  }, [rows, period]);

  const totals = useMemo(() => filteredRows.reduce(
    (acc, r) => ({
      reach:    acc.reach + r.reach,
      views:    acc.views + r.views,
      likes:    acc.likes + r.likes,
      comments: acc.comments + r.comments,
      shares:   acc.shares + r.shares,
    }),
    { reach: 0, views: 0, likes: 0, comments: 0, shares: 0 }
  ), [filteredRows]);

  const engagementBase = totals.reach || totals.views;
  const engagementRate = engagementBase > 0
    ? ((totals.likes + totals.comments + totals.shares) / engagementBase) * 100
    : 0;

  const platformBreakdown = useMemo(() => {
    const byPlatform = new Map<string, number>();
    let max = 0;
    for (const r of filteredRows) {
      const v = (byPlatform.get(r.platform) ?? 0) + r.reach;
      byPlatform.set(r.platform, v);
      if (v > max) max = v;
    }
    return Array.from(byPlatform.entries())
      .map(([id, reach]) => ({
        id,
        reach,
        pct: max > 0 ? Math.round((reach / max) * 100) : 0,
        meta: PLATFORM_META[id] ?? { label: id, bar: "#666" },
      }))
      .sort((a, b) => b.reach - a.reach);
  }, [filteredRows]);

  const dailyChart = useMemo(() => {
    const days = parseInt(period, 10);
    const buckets = new Array<number>(days).fill(0);
    const start = Date.now() - days * 24 * 60 * 60 * 1000;
    for (const r of filteredRows) {
      const t = new Date(r.recordedAt).getTime();
      const idx = Math.floor((t - start) / (24 * 60 * 60 * 1000));
      if (idx >= 0 && idx < days) buckets[idx] += r.reach;
    }
    const max = Math.max(1, ...buckets);
    return buckets.map((v) => ({ value: v, pct: Math.round((v / max) * 100) }));
  }, [filteredRows, period]);

  const hasData = filteredRows.length > 0;
  const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? period;

  return (
    <div style={{ padding: 32, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Analytics</h1>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.875rem", marginTop: 4 }}>
            {periodLabel} · {hasData ? `${filteredRows.length} mesure${filteredRows.length > 1 ? "s" : ""}` : "Aucune donnée"}
          </p>
        </div>
        <div style={{ display: "flex", background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: 4 }}>
          {PERIODS.map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
              style={{
                padding: "8px 18px", borderRadius: 10, border: "none",
                fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                background: period === p.id ? "rgba(124,92,252,0.15)" : "transparent",
                color: period === p.id ? "var(--clr-primary-h)" : "var(--clr-muted)",
                fontFamily: "var(--font)",
              }}>{p.label}</button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div style={{
          background: "var(--clr-card)", border: "1px dashed var(--clr-border)",
          borderRadius: 16, padding: "60px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: "2.4rem", marginBottom: 14 }}>📊</div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>
            Pas encore d&apos;analytics à afficher
          </h2>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.7 }}>
            Vos performances apparaîtront ici dès que vos premiers posts auront été publiés et collectés via les API des réseaux sociaux connectés.
          </p>
          <Link href="/compose" style={{
            display: "inline-block", padding: "10px 22px", borderRadius: 12,
            background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)", color: "#fff",
            fontWeight: 700, fontSize: "0.875rem", textDecoration: "none",
            boxShadow: "0 0 16px rgba(124,92,252,0.35)",
          }}>Créer un post →</Link>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginBottom: 28 }}>
            {[
              { icon: "👁️", value: fmt(totals.reach),                       label: "Portée",        color: "var(--clr-primary-h)" },
              { icon: "💬", value: `${engagementRate.toFixed(1).replace(".", ",")}%`, label: "Engagement",    color: "var(--clr-green)" },
              { icon: "📝", value: publishedCount.toString(),                label: "Posts publiés", color: "var(--clr-text)" },
              { icon: "✨", value: fmt(totals.views),                       label: "Impressions",   color: "var(--clr-text)" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "var(--clr-card)", border: "1px solid var(--clr-border)",
                borderRadius: 16, padding: 24, position: "relative", overflow: "hidden",
              }}>
                <div aria-hidden style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,92,252,0.1),transparent)" }} />
                <div style={{ fontSize: "1.4rem", marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-1px", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--clr-muted)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 20 }}>Portée sur {periodLabel}</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160, paddingTop: 8 }}>
              {dailyChart.map((b, i) => (
                <div key={i} title={`${fmt(b.value)} portée`} style={{
                  flex: 1, height: `${b.pct}%`, minHeight: 2,
                  borderRadius: "4px 4px 0 0",
                  background: "linear-gradient(180deg,#7C5CFC,#5B3EE8)",
                  opacity: b.value > 0 ? 1 : 0.3,
                }} />
              ))}
            </div>
          </div>

          {platformBreakdown.length > 0 && (
            <div style={{ background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 24 }}>Répartition par plateforme</h2>
              {platformBreakdown.map((p, i) => (
                <div key={p.id} style={{ marginBottom: i === platformBreakdown.length - 1 ? 0 : 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600 }}>
                      <SocialIcon platform={p.id} size={16} /> {p.meta.label}
                    </div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-primary-h)" }}>{fmt(p.reach)}</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${p.pct}%`, background: p.meta.bar }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
