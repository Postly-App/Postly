"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Plan, SubscriptionStatus } from "@prisma/client";
import { PLANS } from "@/lib/plans";

type PlanCode = Plan;

interface Props {
  priceIds: {
    proMonthly: string;
    proYearly: string;
    agencyMonthly: string;
    agencyYearly: string;
  };
  subscription: {
    plan: PlanCode;
    status: SubscriptionStatus;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
  } | null;
  hasStripeCustomer: boolean;
  usage: { socialCount: number; postsThisMonth: number };
}

const PLAN_LABEL: Record<PlanCode, string> = {
  FREE: "Gratuit",
  PRO: "Pro",
  AGENCY: "Agence",
};

const STATUS_LABEL: Record<SubscriptionStatus, { label: string; color: string }> = {
  ACTIVE:               { label: "Actif",         color: "#22D3A0" },
  TRIALING:             { label: "Essai",         color: "#9B82FD" },
  PAST_DUE:             { label: "En retard",     color: "#FC5C7C" },
  CANCELED:             { label: "Annulé",        color: "#9B99B5" },
  INCOMPLETE:           { label: "Incomplet",    color: "#FFB800" },
  INCOMPLETE_EXPIRED:   { label: "Expiré",        color: "#9B99B5" },
  UNPAID:               { label: "Impayé",        color: "#FC5C7C" },
  PAUSED:               { label: "En pause",      color: "#FFB800" },
};

const PRICE_FOR_PLAN: Record<PlanCode, number> = { FREE: 0, PRO: 29, AGENCY: 79 };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function BillingClient({ priceIds, subscription, hasStripeCustomer, usage }: Props) {
  const [loading, setLoading]     = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [billing, setBilling]     = useState<"monthly" | "yearly">("monthly");

  const currentPlan: PlanCode = subscription?.plan ?? "FREE";
  const currentStatus: SubscriptionStatus = subscription?.status ?? "ACTIVE";
  const currentPrice = PRICE_FOR_PLAN[currentPlan];

  const limits = {
    socialMax: currentPlan === "FREE" ? 3 : currentPlan === "PRO" ? 15 : Infinity,
    postsMax:  currentPlan === "FREE" ? 10 : Infinity,
  };

  const usageBars: { label: string; value: string; pct: number; color: string }[] = [
    {
      label: "Comptes sociaux",
      value: limits.socialMax === Infinity
        ? `${usage.socialCount}`
        : `${usage.socialCount} / ${limits.socialMax}`,
      pct: limits.socialMax === Infinity ? 0 : Math.min(100, Math.round((usage.socialCount / limits.socialMax) * 100)),
      color: "linear-gradient(90deg,#7C5CFC,#9B82FD)",
    },
    {
      label: "Posts publiés (30j)",
      value: limits.postsMax === Infinity
        ? `${usage.postsThisMonth}`
        : `${usage.postsThisMonth} / ${limits.postsMax}`,
      pct: limits.postsMax === Infinity ? 0 : Math.min(100, Math.round((usage.postsThisMonth / limits.postsMax) * 100)),
      color: "linear-gradient(90deg,#22D3A0,#16A87E)",
    },
  ];

  const getPriceId = (planId: "pro" | "agency") => {
    if (planId === "pro")     return billing === "monthly" ? priceIds.proMonthly     : priceIds.proYearly;
    return                           billing === "monthly" ? priceIds.agencyMonthly  : priceIds.agencyYearly;
  };

  const handleUpgrade = async (planId: "pro" | "agency") => {
    const priceId = getPriceId(planId);
    if (!priceId) { toast.error("Plan non disponible — configure les price IDs."); return; }
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? "Erreur paiement");
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast.error("Erreur réseau. Réessaie dans un instant.");
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (!res.ok) { toast.error("Impossible d'ouvrir le portail."); return; }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast.error("Erreur réseau. Réessaie dans un instant.");
    } finally {
      setLoading(null);
    }
  };

  const plans = [PLANS.pro, PLANS.agency];
  const renewalLabel = subscription
    ? subscription.cancelAtPeriodEnd
      ? `Annulation prévue le ${formatDate(subscription.currentPeriodEnd)}`
      : `Renouvellement le ${formatDate(subscription.currentPeriodEnd)}`
    : "Aucun abonnement actif";

  return (
    <div style={{ padding: 32, maxWidth: 960, marginLeft: "auto", marginRight: "auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Facturation</h1>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.875rem", marginTop: 4 }}>
          Gérez votre abonnement et votre méthode de paiement
        </p>
      </div>

      <div style={{
        background: "var(--clr-card)", borderRadius: 16, marginBottom: 24, overflow: "hidden",
        border: "1px solid var(--clr-border)",
      }}>
        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "4px 10px", borderRadius: 100, marginBottom: 10,
                background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.3)",
                fontSize: "0.72rem", fontWeight: 700, color: "var(--clr-primary-h)",
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}>
                ✦ Plan actuel
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: STATUS_LABEL[currentStatus].color,
                }} />
                <span style={{ color: STATUS_LABEL[currentStatus].color }}>{STATUS_LABEL[currentStatus].label}</span>
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px" }}>{PLAN_LABEL[currentPlan]}</h2>
              <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginTop: 4 }}>
                {renewalLabel}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1 }}>
                {currentPrice}€
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginTop: 4 }}>
                {currentPlan === "FREE" ? "Sans engagement" : "par mois"}
              </div>
              <button
                onClick={() => setShowPlans(!showPlans)}
                style={{
                  marginTop: 12, padding: "7px 16px", borderRadius: 10,
                  border: "1px solid var(--clr-border)", background: "var(--clr-card2)",
                  color: "var(--clr-text)", fontSize: "0.82rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "var(--font)",
                }}
              >
                {showPlans ? "Masquer les plans" : currentPlan === "FREE" ? "Passer à un plan payant" : "Changer de plan"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 28px 28px" }}>
          {usageBars.map((u) => (
            <div key={u.label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "0.8rem", color: "var(--clr-muted)" }}>{u.label}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{u.value}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${u.pct}%`, background: u.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPlans && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 20 }}>
            {(["monthly", "yearly"] as const).map((mode) => (
              <button key={mode} onClick={() => setBilling(mode)}
                style={{
                  padding: "8px 20px", borderRadius: 10, border: "none",
                  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                  background: billing === mode ? "#7C5CFC" : "var(--clr-card2)",
                  color: billing === mode ? "#fff" : "var(--clr-muted)",
                  fontFamily: "var(--font)",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {mode === "monthly" ? "Mensuel" : "Annuel"}
                {mode === "yearly" && (
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, background: "#22D3A0", color: "#000", padding: "2px 6px", borderRadius: 100 }}>-40%</span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {plans.map((plan) => {
              const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const isUpgradeable = plan.id === "pro" || plan.id === "agency";
              const isCurrent = plan.id.toUpperCase() === currentPlan;
              return (
                <div key={plan.id} style={{
                  position: "relative", borderRadius: 16, padding: 24,
                  background: "popular" in plan && plan.popular ? `linear-gradient(160deg,${plan.color}0D,var(--clr-card))` : "var(--clr-card)",
                  border: `1px solid ${"popular" in plan && plan.popular ? plan.color + "50" : "var(--clr-border)"}`,
                }}>
                  {"popular" in plan && plan.popular && (
                    <div style={{
                      position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      padding: "3px 12px", borderRadius: 100,
                      background: plan.color, color: "#fff",
                      fontSize: "0.65rem", fontWeight: 800, whiteSpace: "nowrap",
                    }}>LE PLUS POPULAIRE</div>
                  )}
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: plan.color, marginBottom: 8 }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-1px", marginBottom: 4 }}>
                    {price}€ <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--clr-muted)" }}>/mois</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--clr-muted)", marginBottom: 16 }}>{plan.description}</div>
                  <ul style={{ listStyle: "none", marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.78rem", color: "var(--clr-muted)" }}>
                        <span style={{ color: "#22D3A0", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent || !isUpgradeable ? (
                    <button disabled style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: "1px solid var(--clr-border)", background: "transparent", color: "var(--clr-muted)", fontSize: "0.82rem", fontWeight: 600, cursor: "default" }}>
                      {isCurrent ? "Plan actuel" : "Plan gratuit"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id as "pro" | "agency")}
                      disabled={loading === plan.id}
                      style={{
                        width: "100%", padding: "10px 0", borderRadius: 12, border: "none",
                        background: plan.color, color: "#fff", fontSize: "0.875rem", fontWeight: 700,
                        cursor: loading === plan.id ? "not-allowed" : "pointer",
                        opacity: loading === plan.id ? 0.6 : 1, fontFamily: "var(--font)",
                        boxShadow: `0 0 20px ${plan.color}40`,
                      }}
                    >
                      {loading === plan.id ? "Chargement…" : `Passer à ${plan.name} →`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasStripeCustomer && (
        <div style={{
          background: "var(--clr-card)", border: "1px solid var(--clr-border)",
          borderRadius: 16, padding: "20px 24px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 6 }}>Gestion de la facturation</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)" }}>
              Modifier le moyen de paiement, télécharger les factures, annuler l&apos;abonnement.
            </p>
          </div>
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            style={{
              padding: "9px 20px", borderRadius: 12,
              border: "1px solid rgba(124,92,252,0.35)",
              background: "transparent", color: "var(--clr-primary-h)",
              fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font)",
              opacity: loading === "portal" ? 0.6 : 1,
            }}
          >
            {loading === "portal" ? "Chargement…" : "Ouvrir le portail Stripe →"}
          </button>
        </div>
      )}

      <div style={{
        background: "var(--clr-card)", border: "1px solid var(--clr-border)",
        borderRadius: 12, padding: "14px 20px", textAlign: "center",
      }}>
        <p style={{ fontSize: "0.78rem", color: "var(--clr-muted)" }}>
          ✓ 14 jours d&apos;essai gratuit sur les plans payants &nbsp;·&nbsp;
          ✓ Annulation à tout moment depuis le portail Stripe &nbsp;·&nbsp;
          <Link href="/pricing" style={{ color: "var(--clr-primary-h)", fontWeight: 600 }}>
            Voir les plans
          </Link>
        </p>
      </div>
    </div>
  );
}
