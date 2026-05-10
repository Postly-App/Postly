"use client";

import { useState, useEffect, useRef } from "react";
import SocialIcon from "@/components/SocialIcon";

const PERIODS = ["7j", "30j", "90j"] as const;
type Period = (typeof PERIODS)[number];

const CHART_DATA = [2400,3100,2800,4200,3600,5100,4400,6200,5800,7100,6400,8200,7600,9100,8300,10400,9200,11800,10600,12400,11200,13600,12800,15200,13900,16400,15100,18200,17400,19800];

const PLATFORMS = [
  { id: "INSTAGRAM", label: "Instagram",   color: "#E1306C", bg: "linear-gradient(135deg,#E1306C,#833AB4)", engRate: "14,2%", reach: "38%", pct: 38, barColor: "linear-gradient(90deg,#E1306C,#833AB4)" },
  { id: "TIKTOK",    label: "TikTok",      color: "#69C9D0", bg: "#000",   engRate: "11,7%", reach: "28%", pct: 28, barColor: "#000" },
  { id: "LINKEDIN",  label: "LinkedIn",    color: "#0A66C2", bg: "#0A66C2",engRate: "9,3%",  reach: "18%", pct: 18, barColor: "#0A66C2" },
  { id: "TWITTER",   label: "X / Twitter", color: "#1DA1F2", bg: "#1DA1F2",engRate: "8,1%",  reach: "10%", pct: 10, barColor: "#1DA1F2" },
  { id: "FACEBOOK",  label: "Facebook",    color: "#1877F2", bg: "#1877F2",engRate: "7,5%",  reach: "6%",  pct: 6,  barColor: "#1877F2" },
];

const TOP_POSTS = [
  { rank: 1, platformId: "INSTAGRAM", iconBg: "linear-gradient(135deg,#E1306C,#833AB4)", title: "Notre nouvelle collection printemps — lookbook exclusif ✨", platform: "Instagram", date: "15 mars 2024", reach: "12,4K", eng: "14,2%" },
  { rank: 2, platformId: "TIKTOK",    iconBg: "#000",   title: "POV : Quand ta stratégie marketing enfin ça décolle 🚀",         platform: "TikTok",    date: "18 mars 2024", reach: "9,8K",  eng: "11,7%" },
  { rank: 3, platformId: "LINKEDIN",  iconBg: "#0A66C2",title: "5 outils marketing indispensables pour 2024",                    platform: "LinkedIn",  date: "20 mars 2024", reach: "7,2K",  eng: "9,3%" },
  { rank: 4, platformId: "TWITTER",   iconBg: "#1DA1F2",title: "Thread : Comment j'ai 3x ma portée en 60 jours (sans pub)",      platform: "Twitter/X", date: "22 mars 2024", reach: "5,6K",  eng: "8,1%" },
  { rank: 5, platformId: "FACEBOOK",  iconBg: "#1877F2",title: "Concours : Gagnez 6 mois de Postly Pro ! 🎁",                   platform: "Facebook",  date: "25 mars 2024", reach: "4,1K",  eng: "7,5%" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30j");
  const [barsBuilt, setBarsBuilt] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [progressWidths, setProgressWidths] = useState<number[]>(PLATFORMS.map(() => 0));

  useEffect(() => {
    if (barsBuilt) return;
    const el = chartRef.current;
    if (!el) return;
    setBarsBuilt(true);
    const max = Math.max(...CHART_DATA);
    const colors = ["#7C5CFC","#9B82FD","#B48CFF","#7C5CFC","#6442E0"];
    CHART_DATA.forEach((v, i) => {
      const bar = document.createElement("div");
      const pct = Math.round((v / max) * 100);
      const isLast = i === CHART_DATA.length - 1;
      bar.style.cssText = `
        flex:1;border-radius:4px 4px 0 0;height:0;min-width:0;
        background:${isLast ? "#22D3A0" : colors[i % colors.length]};
        opacity:${isLast ? "1" : "0.6"};
        transition:height 0.8s ease ${i * 15}ms;
        cursor:default;
      `;
      bar.title = `${v.toLocaleString("fr-FR")} reach`;
      el.appendChild(bar);
      requestAnimationFrame(() => { bar.style.height = pct + "%"; });
    });

    /* Animate progress bars */
    setTimeout(() => setProgressWidths(PLATFORMS.map((p) => p.pct)), 300);
  }, [barsBuilt]);

  return (
    <div style={{ padding: 32, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Analytics</h1>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.875rem", marginTop: 4 }}>30 derniers jours · Toutes plateformes</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", background: "var(--clr-card)",
            border: "1px solid var(--clr-border)", borderRadius: 12, padding: 4,
          }}>
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "8px 18px", borderRadius: 10, border: "none",
                fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                background: period === p ? "rgba(124,92,252,0.15)" : "transparent",
                color: period === p ? "var(--clr-primary-h)" : "var(--clr-muted)",
                transition: "var(--transition)", fontFamily: "var(--font)",
              }}>{p}</button>
            ))}
          </div>
          <button style={{
            padding: "9px 18px", borderRadius: 12, border: "1px solid var(--clr-border)",
            background: "var(--clr-card)", color: "var(--clr-muted)",
            fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--font)", transition: "var(--transition)",
          }}>📥 Exporter</button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginBottom: 28 }}>
        {[
          { icon: "👁️", value: "84,2K", label: "Portée",           change: "▲ +22%", color: "var(--clr-primary-h)" },
          { icon: "💬", value: "8,4%",  label: "Engagement",        change: "▲ +1,2%", color: "var(--clr-green)" },
          { icon: "👥", value: "+3,2K", label: "Nouveaux abonnés",  change: "▲ +18%", color: "var(--clr-text)" },
          { icon: "✨", value: "215K",  label: "Impressions",        change: "▲ +31%", color: "var(--clr-text)" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--clr-card)", border: "1px solid var(--clr-border)",
            borderRadius: 16, padding: 24, transition: "var(--transition)", position: "relative", overflow: "hidden",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,92,252,0.25)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--clr-border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
          >
            <div aria-hidden style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,92,252,0.1),transparent)" }} />
            <div style={{ fontSize: "1.4rem", marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-1px", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--clr-muted)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8rem", fontWeight: 700, marginTop: 8, padding: "3px 8px", borderRadius: 100, background: "rgba(34,211,160,0.12)", color: "var(--clr-green)" }}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* ── Bar chart ────────────────────────────────────────── */}
      <div style={{ background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Portée sur 30 jours</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid var(--clr-border)", background: "var(--clr-card2)", color: "var(--clr-muted)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Portée</button>
            <button style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(124,92,252,0.3)", background: "rgba(124,92,252,0.1)", color: "var(--clr-primary-h)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Engagement</button>
          </div>
        </div>
        <div ref={chartRef} style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 160, paddingTop: 8 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {["7 avr.","14 avr.","21 avr.","28 avr.","7 mai"].map((d) => (
            <span key={d} style={{ fontSize: "0.7rem", color: "var(--clr-muted)" }}>{d}</span>
          ))}
        </div>
      </div>

      {/* ── Platform breakdown ───────────────────────────────── */}
      <div style={{ background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 24 }}>Répartition par plateforme</h2>
        {PLATFORMS.map((p, i) => (
          <div key={p.id} style={{ marginBottom: i === PLATFORMS.length - 1 ? 0 : 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600 }}>
                <SocialIcon platform={p.id} size={16} /> {p.label}
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-primary-h)" }}>{p.reach}</div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressWidths[i]}%`, background: p.barColor }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Top posts ────────────────────────────────────────── */}
      <div style={{ background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Top 5 Posts</h2>
          <a href="#" style={{ fontSize: "0.8rem", color: "var(--clr-primary-h)", fontWeight: 600, textDecoration: "none" }}>Voir tout</a>
        </div>
        <ul style={{ listStyle: "none" }}>
          {TOP_POSTS.map((post, i) => (
            <li key={i} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "14px 0",
              borderBottom: i < TOP_POSTS.length - 1 ? "1px solid var(--clr-border)" : "none",
            }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--clr-primary)", width: 28, textAlign: "center", flexShrink: 0 }}>
                {post.rank}
              </div>
              <div style={{
                width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                background: post.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><SocialIcon platform={post.platformId} size={24} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--clr-muted)", marginTop: 3 }}>{post.platform} · {post.date}</div>
              </div>
              <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--clr-primary-h)" }}>{post.reach}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--clr-muted)" }}>Portée</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--clr-green)" }}>{post.eng}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--clr-muted)" }}>Eng.</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
