"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { PLANS, type PlanId } from "@/lib/plans";

type PriceIds = {
  proMonthly: string;
  proYearly: string;
  agencyMonthly: string;
  agencyYearly: string;
};

// Pricing-page-only metadata: CTA labels + comparison items shown grayed out
const PRICING_META = {
  free:   { ctaLabel: "S'abonner gratuitement", ctaGhost: true,  comparisonOff: ["Assistant IA", "Rapports avancés"] },
  pro:    { ctaLabel: "S'abonner au Pro",       ctaGhost: false, comparisonOff: [] as string[] },
  agency: { ctaLabel: "S'abonner à l'Agence",   ctaGhost: true,  comparisonOff: [] as string[] },
} as const;

const PLAN_CARDS = (Object.keys(PLANS) as PlanId[]).map((id) => {
  const plan = PLANS[id];
  const meta = PRICING_META[id];
  return {
    id,
    name: plan.name,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    popular: "popular" in plan ? !!plan.popular : false,
    ctaLabel: meta.ctaLabel,
    ctaGhost: meta.ctaGhost,
    features: [
      ...plan.features.map((text) => ({ text, enabled: true })),
      ...meta.comparisonOff.map((text) => ({ text, enabled: false })),
    ],
  };
});

const FAQ_ITEMS = [
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, vous pouvez monter ou descendre en gamme à tout moment. Les changements sont effectifs immédiatement et les crédits sont calculés au prorata pour la période en cours.",
  },
  {
    q: "Quels réseaux sociaux sont supportés ?",
    a: "Postly supporte Instagram, Facebook, X (Twitter), LinkedIn, TikTok, Pinterest, YouTube et Google Business. De nouveaux réseaux sont régulièrement ajoutés en fonction des demandes de notre communauté.",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Aucun engagement sur les plans mensuels. Pour les plans annuels, vous bénéficiez d'une réduction de 40% sur le tarif mensuel. Vous pouvez annuler à tout moment depuis votre espace facturation.",
  },
  {
    q: "L'assistant IA est-il disponible en français ?",
    a: "Absolument. Notre assistant IA est entraîné spécifiquement pour le marché français et européen. Il comprend les nuances culturelles, les expressions idiomatiques et génère du contenu authentique et engageant en français.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: open ? "1px solid rgba(124,92,252,0.3)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
        transition: "border-color 0.25s",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          background: open ? "var(--clr-card2)" : "var(--clr-card)",
          border: "none",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.95rem",
          fontWeight: 600,
          color: "var(--clr-text)",
          textAlign: "left",
          cursor: "pointer",
          transition: "background 0.2s",
          fontFamily: "var(--font)",
        }}
      >
        <span>{q}</span>
        <span
          aria-hidden="true"
          style={{
            fontSize: "1.2rem",
            color: "var(--clr-primary)",
            flexShrink: 0,
            marginLeft: 16,
            display: "inline-block",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        >+</span>
      </button>
      <div
        style={{
          background: "var(--clr-card)",
          maxHeight: open ? 300 : 0,
          overflow: "hidden",
          padding: open ? "0 24px 20px" : "0 24px",
          transition: "max-height 0.35s ease, padding 0.35s ease",
          color: "var(--clr-muted)",
          fontSize: "0.9rem",
          lineHeight: 1.75,
        }}
      >
        {a}
      </div>
    </div>
  );
}

export default function PricingClient({ priceIds }: { priceIds: PriceIds }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("plan")?.toLowerCase();
    let elId: string | null = null;
    if (fromQuery === "agency") elId = "plan-agency";
    else if (fromQuery === "pro") elId = "plan-pro";
    if (!elId && typeof window !== "undefined") {
      const h = window.location.hash.replace(/^#/, "");
      if (h === "plan-pro" || h === "plan-agency") elId = h;
    }
    if (!elId) return;
    const t = window.setTimeout(() => {
      document.getElementById(elId!)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  const getPriceId = (planId: "pro" | "agency"): string => {
    if (planId === "pro") return billing === "monthly" ? priceIds.proMonthly : priceIds.proYearly;
    return billing === "monthly" ? priceIds.agencyMonthly : priceIds.agencyYearly;
  };

  const handleSubscribe = async (planId: PlanId) => {
    if (planId === "free") {
      router.push(status === "unauthenticated" ? "/signup" : "/dashboard");
      return;
    }
    if (status === "unauthenticated") {
      router.push("/signup?callbackUrl=/pricing");
      return;
    }
    setLoadingPlan(planId);
    try {
      const priceId = getPriceId(planId);
      if (!priceId) { toast.error("Plan non disponible."); setLoadingPlan(null); return; }
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Erreur paiement"); setLoadingPlan(null); return; }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error("Erreur réseau. Réessaie dans un instant.");
      setLoadingPlan(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)", fontFamily: "var(--font)" }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <Logo size={32} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {status === "authenticated" ? (
            <Link href="/dashboard" style={{
              padding: "8px 16px", borderRadius: 12, background: "var(--clr-primary)",
              color: "#fff", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none",
              transition: "background 0.2s",
            }}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" style={{ padding: "8px 16px", fontSize: "0.8rem", fontWeight: 600, color: "var(--clr-muted)", textDecoration: "none" }}>
                Connexion
              </Link>
              <Link href="/signup" style={{
                padding: "8px 16px", borderRadius: 12, background: "var(--clr-primary)",
                color: "#fff", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none",
                boxShadow: "0 0 16px rgba(124,92,252,0.25)",
              }}>S&apos;inscrire</Link>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--clr-primary)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>
          Tarifs
        </div>
        <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 16 }}>
          Simple, transparent,{" "}
          <span className="gradient-text">sans surprises</span>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--clr-muted)", maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>
          Choisissez le plan adapté à vos besoins. Changez ou annulez à tout moment.
        </p>

        {/* ── Toggle ─────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 14,
            padding: "4px 14px 4px 14px",
            background: "var(--clr-card)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 100,
          }}>
            <span
              onClick={() => setBilling("monthly")}
              style={{
                fontSize: "0.875rem", fontWeight: 600, padding: "4px 4px",
                color: billing === "monthly" ? "var(--clr-text)" : "var(--clr-muted)",
                cursor: "pointer", transition: "color 0.2s", userSelect: "none",
              }}
            >Mensuel</span>

            {/* Switch */}
            <div
              onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
              style={{
                position: "relative", width: 52, height: 28,
                background: billing === "yearly" ? "var(--clr-primary)" : "var(--clr-card2)",
                borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", transition: "background 0.25s, box-shadow 0.25s",
                boxShadow: billing === "yearly" ? "0 0 16px rgba(124,92,252,0.5)" : "none",
                flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: 3,
                width: 20, height: 20, borderRadius: "50%", background: "#fff",
                transform: billing === "yearly" ? "translateX(24px)" : "translateX(0)",
                transition: "transform 0.25s ease",
              }} />
            </div>

            <span
              onClick={() => setBilling("yearly")}
              style={{
                fontSize: "0.875rem", fontWeight: 600, padding: "4px 4px",
                color: billing === "yearly" ? "var(--clr-text)" : "var(--clr-muted)",
                cursor: "pointer", transition: "color 0.2s", userSelect: "none",
              }}
            >Annuel</span>

            <span style={{
              background: "linear-gradient(135deg,#22D3A0,#16A87E)", color: "#001A12",
              fontSize: "0.7rem", fontWeight: 800, padding: "3px 8px", borderRadius: 100,
              letterSpacing: "0.5px",
              opacity: billing === "yearly" ? 1 : 0, transition: "opacity 0.3s",
              pointerEvents: "none",
            }}>-40%</span>
          </div>
        </div>
      </section>

      {/* ── Cards ───────────────────────────────────────────── */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: 24,
        }}>
          {PLAN_CARDS.map((plan) => {
            const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const isLoading = loadingPlan === plan.id;
            return (
              <div
                id={`plan-${plan.id}`}
                key={plan.id}
                style={{
                  background: "var(--clr-card)",
                  border: plan.popular
                    ? "1px solid rgba(124,92,252,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 24,
                  padding: 36,
                  position: "relative",
                  transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
                  boxShadow: plan.popular
                    ? "0 4px 32px rgba(0,0,0,0.45), 0 0 30px rgba(124,92,252,0.35)"
                    : "0 4px 32px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,92,252,0.3)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 32px rgba(0,0,0,0.45), 0 0 30px rgba(124,92,252,0.35)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = plan.popular ? "rgba(124,92,252,0.5)" : "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = plan.popular
                    ? "0 4px 32px rgba(0,0,0,0.45), 0 0 30px rgba(124,92,252,0.35)"
                    : "0 4px 32px rgba(0,0,0,0.3)";
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)", color: "#fff",
                    fontSize: "0.75rem", fontWeight: 700, padding: "5px 18px",
                    borderRadius: 100, whiteSpace: "nowrap", letterSpacing: "0.5px",
                  }}>⚡ Populaire</div>
                )}

                {/* Plan name */}
                <div style={{
                  fontSize: "1rem", fontWeight: 700, color: "var(--clr-muted)",
                  marginBottom: 20, letterSpacing: "1px", textTransform: "uppercase",
                }}>{plan.name}</div>

                {/* Price */}
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-2px" }}>
                    {price === 0 ? "0€" : `${price}€`}
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "var(--clr-muted)", fontWeight: 400 }}>/mois</span>
                </div>
                {billing === "yearly" && plan.monthlyPrice > 0 && (
                  <div style={{ fontSize: "0.8rem", color: "var(--clr-muted)", marginBottom: 4 }}>
                    Facturé <strong style={{ color: "var(--clr-text)" }}>{plan.yearlyPrice * 12}€</strong>/an
                    <span style={{ marginLeft: 8, textDecoration: "line-through", color: "#5C5A75" }}>{plan.monthlyPrice * 12}€</span>
                  </div>
                )}

                {/* Description */}
                <p style={{
                  fontSize: "0.875rem", color: "var(--clr-muted)",
                  marginBottom: 28, lineHeight: 1.6, marginTop: 8,
                }}>{plan.description}</p>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 24 }} />

                {/* Features */}
                <ul style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32, listStyle: "none", padding: 0 }}>
                  {plan.features.map(({ text, enabled }) => (
                    <li
                      key={text}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        fontSize: "0.875rem", color: "var(--clr-muted)",
                        opacity: enabled ? 1 : 0.35,
                      }}
                    >
                      <span style={{
                        color: enabled ? "var(--clr-green)" : "var(--clr-muted)",
                        fontSize: "0.9rem", flexShrink: 0, fontWeight: 700,
                      }}>{enabled ? "✓" : "✗"}</span>
                      {text}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  style={{
                    width: "100%", padding: "13px 0", borderRadius: 16,
                    fontFamily: "var(--font)", fontWeight: 700, fontSize: "0.9rem",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                    transition: "all 0.25s",
                    ...(plan.ctaGhost ? {
                      background: "rgba(255,255,255,0.06)",
                      color: "#F1F0FF",
                      border: "1px solid rgba(255,255,255,0.12)",
                    } : {
                      background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
                      color: "#fff",
                      boxShadow: "0 0 24px rgba(124,92,252,0.4)",
                      border: "none",
                    }),
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  {isLoading ? "Redirection…" : plan.ctaLabel}
                </button>

                {plan.monthlyPrice > 0 && (
                  <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#5C5A75", marginTop: 10 }}>
                    ✓ 14 jours d&apos;essai gratuit · Sans engagement
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust bar */}
        <div style={{
          marginTop: 40, padding: "16px 24px", textAlign: "center",
          background: "var(--clr-card)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
        }}>
          <p style={{ fontSize: "0.8rem", color: "var(--clr-muted)" }}>
            ✓ Paiement sécurisé via Stripe &nbsp;·&nbsp;
            ✓ Sans carte bancaire pour le plan gratuit &nbsp;·&nbsp;
            ✓ Annulation à tout moment
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--clr-primary)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>
            FAQ
          </div>
          <h2 style={{ fontSize: "clamp(22px,4vw,36px)", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Questions <span className="gradient-text">fréquentes</span>
          </h2>
        </div>

        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} />
        ))}

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--clr-muted)" }}>
            Des questions ?{" "}
            <a href="mailto:contact@postly.app" style={{ color: "var(--clr-primary)", fontWeight: 600 }}>
              Contacte-nous
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
