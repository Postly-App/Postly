"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PLANS } from "@/lib/plans";

const INVOICES = [
  { id: "#2024-04-01", date: "1 avril 2024",    plan: "Pro — Mensuel",   amount: "29,00 €" },
  { id: "#2024-03-01", date: "1 mars 2024",     plan: "Pro — Mensuel",   amount: "29,00 €" },
  { id: "#2024-02-01", date: "1 février 2024",  plan: "Pro — Mensuel",   amount: "29,00 €" },
  { id: "#2024-01-01", date: "1 janvier 2024",  plan: "Pro — Mensuel",   amount: "29,00 €" },
  { id: "#2023-12-01", date: "1 décembre 2023", plan: "Free → Pro",      amount: "29,00 €" },
];

const USAGE = [
  { label: "Comptes sociaux", value: "8 / 15",        pct: 53,  color: "linear-gradient(90deg,#7C5CFC,#9B82FD)" },
  { label: "Posts ce mois",   value: "48 / ∞",        pct: 100, color: "linear-gradient(90deg,#22D3A0,#16A87E)" },
  { label: "Stockage médias", value: "12 Go / 50 Go", pct: 24,  color: "linear-gradient(90deg,#7C5CFC,#22D3A0)" },
];

interface Props {
  priceIds: {
    proMonthly: string;
    proYearly: string;
    agencyMonthly: string;
    agencyYearly: string;
  };
}

export default function BillingClient({ priceIds }: Props) {
  const [loading, setLoading]     = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [billing, setBilling]     = useState<"monthly" | "yearly">("monthly");

  const getPriceId = (planId: "pro" | "agency") => {
    if (planId === "pro")     return billing === "monthly" ? priceIds.proMonthly     : priceIds.proYearly;
    return                           billing === "monthly" ? priceIds.agencyMonthly  : priceIds.agencyYearly;
  };

  const handleUpgrade = async (planId: "pro" | "agency") => {
    const priceId = getPriceId(planId);
    if (!priceId) { toast.error("Plan non disponible."); return; }
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Erreur paiement"); return; }
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

  const plans = [PLANS.free, PLANS.pro, PLANS.agency];

  return (
    <div style={{ padding: 32, maxWidth: 960, marginLeft: "auto", marginRight: "auto" }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Facturation</h1>
        <p style={{ color: "var(--clr-muted)", fontSize: "0.875rem", marginTop: 4 }}>
          Gérez votre abonnement et consultez vos factures
        </p>
      </div>

      {/* ── Current plan ──────────────────────────────────── */}
      <div style={{
        background: "var(--clr-card)", borderRadius: 16, marginBottom: 24, overflow: "hidden",
        border: "1px solid var(--clr-border)",
        borderTop: "3px solid transparent",
        borderImage: "linear-gradient(90deg,#7C5CFC,#9B82FD) 1",
      }}>
        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 10px", borderRadius: 100, marginBottom: 10,
                background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.3)",
                fontSize: "0.72rem", fontWeight: 700, color: "var(--clr-primary-h)",
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}>
                ✦ Plan actuel
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Pro</h2>
              <p style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginTop: 4 }}>
                Votre abonnement se renouvelle le <strong style={{ color: "var(--clr-text)" }}>1er mai 2024</strong>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1 }}>29€</div>
              <div style={{ fontSize: "0.82rem", color: "var(--clr-muted)", marginTop: 4 }}>par mois</div>
              <button
                onClick={() => setShowPlans(!showPlans)}
                style={{
                  marginTop: 12, padding: "7px 16px", borderRadius: 10,
                  border: "1px solid var(--clr-border)", background: "var(--clr-card2)",
                  color: "var(--clr-text)", fontSize: "0.82rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "var(--font)",
                }}
              >
                {showPlans ? "Masquer les plans" : "Changer de plan"}
              </button>
            </div>
          </div>
        </div>

        {/* Usage bars */}
        <div style={{ padding: "0 28px 28px" }}>
          {USAGE.map((u) => (
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

      {/* ── Plan upgrade cards (collapsible) ──────────────── */}
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
                  fontFamily: "var(--font)", transition: "var(--transition)",
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
                  {!isUpgradeable ? (
                    <button disabled style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: "1px solid var(--clr-border)", background: "transparent", color: "var(--clr-muted)", fontSize: "0.82rem", fontWeight: 600, cursor: "default" }}>
                      Plan actuel
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
                        boxShadow: `0 0 20px ${plan.color}40`, transition: "var(--transition)",
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

      {/* ── Payment method ────────────────────────────────── */}
      <div style={{
        background: "var(--clr-card)", border: "1px solid var(--clr-border)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 8 }}>Moyen de paiement</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", color: "var(--clr-muted)" }}>
            <span style={{ background: "rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: 6, fontWeight: 800, fontSize: "0.78rem" }}>VISA</span>
            <span>•••• •••• •••• 4242</span>
            <span>Exp. 12/26</span>
          </div>
        </div>
        <button
          onClick={handlePortal}
          disabled={loading === "portal"}
          style={{
            padding: "9px 20px", borderRadius: 12,
            border: "1px solid rgba(124,92,252,0.35)",
            background: "transparent", color: "var(--clr-primary-h)",
            fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
            fontFamily: "var(--font)", transition: "var(--transition)",
            opacity: loading === "portal" ? 0.6 : 1,
          }}
        >
          {loading === "portal" ? "Chargement…" : "Portail Stripe →"}
        </button>
      </div>

      {/* ── Invoice history ───────────────────────────────── */}
      <div style={{ background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--clr-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Historique des factures</h3>
          <button
            onClick={() => toast.info("Export PDF bientôt disponible")}
            style={{
              padding: "7px 14px", borderRadius: 10, border: "1px solid var(--clr-border)",
              background: "var(--clr-card2)", color: "var(--clr-muted)",
              fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)",
            }}>📥 Tout télécharger</button>
        </div>
        <table className="invoices-table" aria-label="Historique des factures" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--clr-border)" }}>
              {["Facture", "Date", "Plan", "Montant", "Statut", "Action"].map((h) => (
                <th key={h} scope="col" style={{ padding: "12px 24px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv, i) => (
              <tr key={inv.id} style={{ borderBottom: i < INVOICES.length - 1 ? "1px solid var(--clr-border)" : "none" }}>
                <td style={{ padding: "14px 24px", fontSize: "0.875rem", fontWeight: 600 }}>{inv.id}</td>
                <td style={{ padding: "14px 24px", fontSize: "0.875rem", color: "var(--clr-muted)" }}>{inv.date}</td>
                <td style={{ padding: "14px 24px", fontSize: "0.875rem" }}>{inv.plan}</td>
                <td style={{ padding: "14px 24px", fontSize: "0.875rem", fontWeight: 700 }}>{inv.amount}</td>
                <td style={{ padding: "14px 24px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 10px", borderRadius: 100,
                    background: "rgba(34,211,160,0.12)", color: "#22D3A0",
                    fontSize: "0.72rem", fontWeight: 700,
                  }}>✓ Payé</span>
                </td>
                <td style={{ padding: "14px 24px" }}>
                  <button
                    onClick={() => toast.info("Téléchargement PDF bientôt disponible")}
                    style={{ background: "none", border: "none", fontSize: "0.82rem", color: "var(--clr-primary-h)", fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "var(--font)" }}
                  >↓ PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Guarantee ─────────────────────────────────────── */}
      <div style={{
        marginTop: 20, background: "var(--clr-card)", border: "1px solid var(--clr-border)",
        borderRadius: 12, padding: "14px 20px", textAlign: "center",
      }}>
        <p style={{ fontSize: "0.78rem", color: "var(--clr-muted)" }}>
          ✓ 14 jours d&apos;essai gratuit sur tous les plans payants &nbsp;·&nbsp;
          ✓ Sans carte bancaire &nbsp;·&nbsp;
          ✓ Annulation à tout moment &nbsp;·&nbsp;
          <Link href="/pricing" style={{ color: "var(--clr-primary-h)", fontWeight: 600 }}>
            Voir tous les plans
          </Link>
        </p>
      </div>
    </div>
  );
}
