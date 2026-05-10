"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";

/* ──────────────────────────────────────────────────────────────
   Hooks
─────────────────────────────────────────────────────────────── */
function useAnimatedNumber(target: number, decimals = 0) {
  const mv = useMotionValue(0);
  const sp = useSpring(mv, { stiffness: 60, damping: 20, mass: 0.6 });
  const text = useTransform(sp, (v) => {
    const fixed = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
    return fixed.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  });
  useEffect(() => {
    mv.set(target);
  }, [target, mv]);
  return text;
}

function useTilt(maxDeg = 4) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useTransform(py, [0, 1], [maxDeg, -maxDeg]);
  const ry = useTransform(px, [0, 1], [-maxDeg, maxDeg]);
  const sRx = useSpring(rx, { stiffness: 80, damping: 18 });
  const sRy = useSpring(ry, { stiffness: 80, damping: 18 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { px.set(0.5); py.set(0.5); };

  return { ref, onMove, reset, rotateX: sRx, rotateY: sRy };
}

/* ──────────────────────────────────────────────────────────────
   Sub-components
─────────────────────────────────────────────────────────────── */
function StatCard({ label, value, suffix, color, decimals = 0 }: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  decimals?: number;
}) {
  const text = useAnimatedNumber(value, decimals);
  return (
    <div style={{
      background: "rgba(20,20,32,0.6)",
      borderRadius: 12,
      padding: 14,
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}>
      <div style={{ fontSize: "1.25rem", fontWeight: 800, color, letterSpacing: "-0.5px", display: "flex", alignItems: "baseline", gap: 2 }}>
        <motion.span>{text}</motion.span>
        {suffix && <span style={{ fontSize: "0.85em" }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: "0.7rem", color: "rgba(155,153,181,0.85)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ChartBars({ tick }: { tick: number }) {
  const N = 14;
  const bars = Array.from({ length: N }, (_, i) => {
    const base = 35 + Math.sin(i * 0.7 + tick * 0.4) * 18 + (i / (N - 1)) * 30;
    const wob  = Math.sin(tick * 0.9 + i) * 8;
    return Math.max(8, Math.min(100, base + wob));
  });

  // Smooth area path over the bars (relative coordinates 0..100 in both axes)
  const stepX = 100 / (N - 1);
  const points = bars.map((h, i) => ({ x: i * stepX, y: 100 - h }));

  // Cubic-Bezier smoothing through points (Catmull-Rom -> Bezier)
  const path = (() => {
    if (!points.length) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  })();
  const areaPath = path + ` L 100 100 L 0 100 Z`;

  return (
    <div style={{ position: "relative", height: 70 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 70 }}>
        {bars.map((h, i) => {
          const isPeak = i === bars.length - 1;
          const isTrigger = i % 5 === 4;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                flex: 1,
                borderRadius: "3px 3px 0 0",
                background: isPeak
                  ? "linear-gradient(180deg,#22D3A0,#16A87E)"
                  : isTrigger
                    ? "linear-gradient(180deg,#9B82FD,#5B3EE8)"
                    : "linear-gradient(180deg,rgba(124,92,252,0.45),rgba(124,92,252,0.15))",
                boxShadow: isPeak ? "0 0 12px rgba(34,211,160,0.5)" : "none",
                opacity: 0.95,
              }}
            />
          );
        })}
      </div>

      {/* Smooth area + line overlay */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9B82FD" />
            <stop offset="60%" stopColor="#7C5CFC" />
            <stop offset="100%" stopColor="#22D3A0" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124,92,252,0.45)" />
            <stop offset="100%" stopColor="rgba(124,92,252,0)" />
          </linearGradient>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d={areaPath}
          fill="url(#areaGrad)"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          key={`line-${tick}`}
          d={path}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#lineGlow)"
          vectorEffect="non-scaling-stroke"
        />
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={1.6}
          fill="#22D3A0"
          animate={{ r: [1.6, 2.6, 1.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

function Equalizer() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ height: ["30%", "100%", "55%", "85%", "30%"] }}
          transition={{
            duration: 1.1 + i * 0.12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.07,
          }}
          style={{
            width: 2,
            background: "linear-gradient(180deg,#22D3A0,#16A87E)",
            borderRadius: 1,
            boxShadow: "0 0 6px rgba(34,211,160,0.6)",
          }}
        />
      ))}
    </div>
  );
}

const BASE_NOTIFS = [
  { color: "#E1306C", platform: "IG", text: "Sophie M. a aimé votre post",  amount: "+24" },
  { color: "#0A66C2", platform: "in", text: "Lucas D. a partagé votre post", amount: "+12" },
  { color: "#1DA1F2", platform: "X",  text: "Pic d'engagement détecté",      amount: "+86" },
  { color: "#FF0050", platform: "TT", text: "Nouvelle vidéo virale 🔥",      amount: "+1,2K" },
  { color: "#22D3A0", platform: "✓",  text: "Post publié sur 4 réseaux",     amount: "OK" },
  { color: "#9B82FD", platform: "AI", text: "Légende optimisée par l'IA",    amount: "+8%" },
];

function NotifFeed() {
  const [stack, setStack] = useState(() => BASE_NOTIFS.slice(0, 3).map((n, i) => ({ ...n, key: i })));
  const counter = useRef(3);

  useEffect(() => {
    const id = setInterval(() => {
      const next = BASE_NOTIFS[counter.current % BASE_NOTIFS.length];
      const key  = counter.current++;
      setStack((s) => [{ ...next, key }, ...s].slice(0, 3));
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <AnimatePresence initial={false}>
        {stack.map((n) => (
          <motion.div
            key={n.key}
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(20,20,32,0.7)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0,
              background: n.color, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.6rem", fontWeight: 800,
              boxShadow: `0 0 12px ${n.color}40`,
            }}>{n.platform}</div>
            <div style={{ flex: 1, minWidth: 0, fontSize: "0.7rem", color: "rgba(241,240,255,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {n.text}
            </div>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#22D3A0" }}>{n.amount}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function FloatingChip({ left, top, delay, children, color }: { left: string; top: string; delay: number; children: React.ReactNode; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.2 + delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute", left, top,
        padding: "6px 12px", borderRadius: 100,
        background: "rgba(15,15,24,0.85)",
        border: `1px solid ${color}40`,
        boxShadow: `0 0 24px ${color}30`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        fontSize: "0.7rem", fontWeight: 700, color: "#F1F0FF",
        display: "inline-flex", alignItems: "center", gap: 6,
        zIndex: 5,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main
─────────────────────────────────────────────────────────────── */
export default function LiveDashboard() {
  const [tick, setTick] = useState(0);
  const [stats, setStats] = useState({ reach: 12500, engagement: 8.4, posts: 48, followers: 3200 });
  const tilt = useTilt(5);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setStats((s) => ({
        reach:       Math.max(8000,  s.reach       + Math.round((Math.random() - 0.4) * 400)),
        engagement:  Math.max(5,     +(s.engagement + (Math.random() - 0.45) * 0.4).toFixed(1)),
        posts:       s.posts + (Math.random() > 0.7 ? 1 : 0),
        followers:   Math.max(2500,  s.followers   + Math.round((Math.random() - 0.3) * 60)),
      }));
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.onMove}
      onMouseLeave={tilt.reset}
      initial={{ opacity: 0, y: 60, rotateX: 14 }}
      animate={{ opacity: 1, y: 0, rotateX: 6 }}
      transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        width: "min(960px, 92vw)",
        margin: "0 auto",
        perspective: 1400,
        transformStyle: "preserve-3d",
        rotateY: tilt.rotateY,
        willChange: "transform",
      }}
    >
      {/* Floating chips around the card */}
      <FloatingChip left="-3%"   top="14%"  delay={0.0} color="#22D3A0">+12,4% engagement</FloatingChip>
      <FloatingChip left="92%"   top="6%"   delay={0.15} color="#9B82FD">IA · Légende prête</FloatingChip>
      <FloatingChip left="94%"   top="68%"  delay={0.3} color="#F06292">3 posts planifiés</FloatingChip>
      <FloatingChip left="-4%"   top="78%"  delay={0.45} color="#7CC4FF">Live sync 6 réseaux</FloatingChip>

      {/* Card */}
      <motion.div
        style={{
          background: "linear-gradient(180deg, rgba(17,17,24,0.9), rgba(10,10,18,0.92))",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow:
            "0 60px 120px rgba(0,0,0,0.7), 0 0 80px rgba(124,92,252,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
          transformStyle: "preserve-3d",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Browser bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(8,8,15,0.7)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#FC5C5C","#FFBD2E","#27C93F"].map((c) => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
          </div>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 8,
            padding: "5px 12px", fontSize: "0.72rem", color: "rgba(155,153,181,0.7)",
            textAlign: "center", fontFamily: "ui-monospace, monospace",
            border: "1px solid rgba(255,255,255,0.04)",
          }}>
            <span style={{ color: "#22D3A0" }}>●</span>&nbsp;&nbsp;postly.app/dashboard
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3].map((i) => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />)}
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 220px", minHeight: 380, background: "transparent" }}>

          {/* Sidebar */}
          <div style={{ padding: 16, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(155,153,181,0.5)", letterSpacing: "1px", padding: "0 12px 8px", textTransform: "uppercase" }}>Postly</div>
            {[
              { label: "Dashboard",  active: true,  badge: null },
              { label: "Studio",     active: false, badge: "3" },
              { label: "Analytics",  active: false, badge: null },
              { label: "Comptes",    active: false, badge: "✓" },
              { label: "Paramètres", active: false, badge: null },
            ].map(({ label, active, badge }) => (
              <div key={label} style={{
                padding: "8px 12px", borderRadius: 10, fontSize: "0.78rem", fontWeight: 500,
                background: active ? "linear-gradient(135deg,rgba(124,92,252,0.18),rgba(124,92,252,0.08))" : "transparent",
                color: active ? "#9B82FD" : "rgba(155,153,181,0.7)",
                border: active ? "1px solid rgba(124,92,252,0.25)" : "1px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
              }}>
                <span>{label}</span>
                {badge && <span style={{ fontSize: "0.6rem", padding: "2px 6px", borderRadius: 100, background: "rgba(124,92,252,0.15)", color: "#9B82FD", fontWeight: 700 }}>{badge}</span>}
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ padding: 12, borderRadius: 12, background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.15)" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9B82FD", marginBottom: 4 }}>✦ IA Pro</div>
              <div style={{ fontSize: "0.6rem", color: "rgba(155,153,181,0.7)", lineHeight: 1.5 }}>Suggestion prête</div>
            </div>
          </div>

          {/* Main */}
          <div style={{ padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
              <StatCard label="Portée"     value={stats.reach}      color="#9B82FD" />
              <StatCard label="Engagement" value={stats.engagement} color="#22D3A0" suffix="%" decimals={1} />
              <StatCard label="Posts"      value={stats.posts}      color="#F1F0FF" />
              <StatCard label="Abonnés"    value={stats.followers}  color="#F1F0FF" />
            </div>

            <div style={{ background: "rgba(20,20,32,0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(241,240,255,0.85)" }}>Portée — 14 derniers jours</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.65rem", color: "#22D3A0", fontWeight: 700 }}>
                  <Equalizer />
                  Live
                </div>
              </div>
              <ChartBars tick={tick} />
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(20,20,32,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(155,153,181,0.7)", marginBottom: 6 }}>Prochain post</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#F1F0FF" }}>Collection printemps ✨</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(155,153,181,0.6)", marginTop: 4 }}>IG · LinkedIn · Aujourd&apos;hui 18:00</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(34,211,160,0.06)", border: "1px solid rgba(34,211,160,0.2)" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(34,211,160,0.85)", marginBottom: 6, fontWeight: 700 }}>✦ Score IA</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F1F0FF" }}>Très élevé · 92/100</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(155,153,181,0.6)", marginTop: 4 }}>Optimisé pour Instagram</div>
              </div>
            </div>
          </div>

          {/* Right rail: live notifications */}
          <div style={{ padding: 16, borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(241,240,255,0.85)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Activité</div>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22D3A0", boxShadow: "0 0 8px #22D3A0", animation: "pulse 1.6s ease-in-out infinite" }} />
            </div>
            <NotifFeed />

            <div style={{ marginTop: "auto", padding: 10, borderRadius: 10, background: "linear-gradient(135deg, rgba(124,92,252,0.15), rgba(91,62,232,0.1))", border: "1px solid rgba(124,92,252,0.25)" }}>
              <div style={{ fontSize: "0.6rem", color: "rgba(155,130,253,0.85)", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>✦ Recommandation IA</div>
              <div style={{ fontSize: "0.7rem", color: "rgba(241,240,255,0.9)", lineHeight: 1.45 }}>Publie demain à 18h pour +34% de portée.</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reflection underneath */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: "auto -10% -40% -10%", height: "40%",
        background: "linear-gradient(to bottom, rgba(124,92,252,0.18), transparent 70%)",
        filter: "blur(40px)",
        transform: "translateZ(-50px) rotateX(60deg) scaleY(0.5)",
        transformOrigin: "top center",
        pointerEvents: "none",
        zIndex: -1,
      }} />
    </motion.div>
  );
}

// silence unused-import warning if any
export type _ = MotionValue;
