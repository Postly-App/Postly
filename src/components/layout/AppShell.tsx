"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import CommandPalette from "@/components/layout/CommandPalette";
import type { UserPlanContext } from "@/lib/plan-limits";

/* ── SVG Icons ──────────────────────────────────────────── */
const DashIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
const PenIcon   = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const ChartIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>;
const LinkIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
const GearIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
const CardIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const UpIcon    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>;
const BackIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>;

/* ── Agency icons ──────────────────────────────────────────── */
const UsersIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BriefcaseIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const KeyIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;

const MAIN_NAV = [
  { href: "/dashboard", icon: DashIcon,  label: "Dashboard" },
  { href: "/compose",   icon: PenIcon,   label: "Studio" },
  { href: "/analytics", icon: ChartIcon, label: "Analytics" },
  { href: "/settings",  icon: LinkIcon,  label: "Comptes" },
];

const AGENCY_NAV = [
  { href: "/clients",            icon: BriefcaseIcon, label: "Clients" },
  { href: "/settings/team",      icon: UsersIcon,     label: "Équipe" },
  { href: "/settings/api-keys",  icon: KeyIcon,       label: "API" },
];

const BOTTOM_NAV = [
  { href: "/settings",  icon: GearIcon, label: "Paramètres" },
  { href: "/billing",   icon: CardIcon, label: "Facturation" },
];

interface Props {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null; image?: string | null };
  planContext?: UserPlanContext;
}

export default function AppShell({ children, user, planContext }: Props) {
  // Default to FREE if planContext somehow not provided (defensive)
  const plan = planContext?.plan ?? "FREE";
  const isPaid = planContext?.isPaid ?? false;
  const isAgency = planContext?.isAgency ?? false;
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileOpen) {
      document.body.classList.add("app-drawer-locked");
    } else {
      document.body.classList.remove("app-drawer-locked");
    }
    return () => document.body.classList.remove("app-drawer-locked");
  }, [mobileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--clr-bg)",
        color: "var(--clr-text)",
        position: "relative",
      }}
    >
      {/* Ambient orbs — TRÈS subtils, pour donner de la profondeur sans casser le contraste */}
      <div aria-hidden="true" className="app-ambient" />

      {/* Mobile backdrop — only visible when drawer open */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className="app-mobile-backdrop"
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside
        className={`app-sidebar ${mobileOpen ? "app-sidebar-open" : ""}`}
        style={{
          width: 220, flexShrink: 0,
          display: "flex", flexDirection: "column",
          borderRight: "1px solid var(--clr-border)",
          background: "#0D0D14",
          position: "sticky", top: 0, height: "100vh",
          overflowY: "auto",
          zIndex: 50,
        }}
      >
        {/* Logo + plan badge */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", height: 64,
          borderBottom: "1px solid var(--clr-border)",
        }}>
          <Logo size={28} />
          {isPaid && (
            <span style={{
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.10em",
              padding: "3px 7px", borderRadius: 6,
              color: isAgency ? "#F9A8D4" : "#A5B4FC",
              background: isAgency
                ? "rgba(244,114,182,0.12)"
                : "rgba(99,102,241,0.14)",
              border: isAgency
                ? "1px solid rgba(244,114,182,0.30)"
                : "1px solid rgba(99,102,241,0.30)",
            }}>
              {isAgency ? "AGENCE" : "PRO"}
            </span>
          )}
        </div>

        {/* Main nav */}
        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(155,153,181,0.45)", padding: "0 10px", marginBottom: 6 }}>
            NAVIGATION
          </div>

          {MAIN_NAV.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  fontSize: "0.875rem", fontWeight: 500,
                  color: active ? "var(--clr-primary-h)" : "var(--clr-muted)",
                  background: active ? "rgba(124,92,252,0.15)" : "transparent",
                  border: active ? "1px solid rgba(124,92,252,0.2)" : "1px solid transparent",
                  transition: "var(--transition)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-muted)";
                  }
                }}
              >
                <Icon />
                {label}
              </Link>
            );
          })}

          {/* AGENCY-only section — only renders for Plan Agence */}
          {isAgency && (
            <>
              <div style={{ height: 1, background: "var(--clr-border)", margin: "12px 0" }} />
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#F9A8D4",
                padding: "0 10px", marginBottom: 6,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "#F472B6",
                  boxShadow: "0 0 8px rgba(244,114,182,0.7)",
                }} />
                AGENCE
              </div>

              {AGENCY_NAV.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      fontSize: "0.875rem", fontWeight: 500,
                      color: active ? "#F9A8D4" : "var(--clr-muted)",
                      background: active ? "rgba(244,114,182,0.12)" : "transparent",
                      border: active ? "1px solid rgba(244,114,182,0.25)" : "1px solid transparent",
                      transition: "var(--transition)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(244,114,182,0.06)";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#F9A8D4";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-muted)";
                      }
                    }}
                  >
                    <Icon />
                    {label}
                  </Link>
                );
              })}
            </>
          )}

          <div style={{ height: 1, background: "var(--clr-border)", margin: "12px 0" }} />
          <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(155,153,181,0.45)", padding: "0 10px", marginBottom: 6 }}>
            COMPTE
          </div>

          {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  fontSize: "0.875rem", fontWeight: 500,
                  color: active ? "var(--clr-primary-h)" : "var(--clr-muted)",
                  background: active ? "rgba(124,92,252,0.15)" : "transparent",
                  border: active ? "1px solid rgba(124,92,252,0.2)" : "1px solid transparent",
                  transition: "var(--transition)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-muted)";
                  }
                }}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ padding: "12px 12px 16px", borderTop: "1px solid var(--clr-border)", display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Upgrade CTA — affiché uniquement pour les utilisateurs FREE */}
          {!isPaid && (
            <div style={{
              padding: "12px 14px", borderRadius: 12,
              background: "linear-gradient(135deg,rgba(124,92,252,0.15),rgba(240,98,146,0.08))",
              border: "1px solid rgba(124,92,252,0.25)", marginBottom: 8,
            }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                <span style={{ background: "linear-gradient(135deg,#9B82FD,#F06292)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  ✦ Passer Pro
                </span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--clr-muted)", marginBottom: 8, lineHeight: 1.5 }}>
                Accédez à l&apos;IA et aux analytics avancés.
              </p>
              <Link href="/billing" style={{
                display: "block", textAlign: "center", padding: "6px 0",
                borderRadius: 8, background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
                color: "#fff", fontSize: "0.75rem", fontWeight: 700,
                boxShadow: "0 0 12px rgba(124,92,252,0.4)", textDecoration: "none",
              }}>Choisir un plan →</Link>
            </div>
          )}

          {/* Plan actif — affiché pour PRO et AGENCY */}
          {isPaid && (
            <Link href="/billing" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12, marginBottom: 8,
              background: isAgency
                ? "linear-gradient(135deg, rgba(244,114,182,0.14), rgba(192,132,252,0.10))"
                : "linear-gradient(135deg, rgba(99,102,241,0.14), rgba(34,211,238,0.08))",
              border: isAgency
                ? "1px solid rgba(244,114,182,0.30)"
                : "1px solid rgba(99,102,241,0.30)",
              textDecoration: "none",
              transition: "var(--transition)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: isAgency
                  ? "linear-gradient(135deg, #F472B6, #C084FC)"
                  : "linear-gradient(135deg, #818CF8, #6366F1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: 800, color: "#fff",
                boxShadow: isAgency
                  ? "0 0 12px rgba(244,114,182,0.45)"
                  : "0 0 12px rgba(99,102,241,0.45)",
                flexShrink: 0,
              }}>
                ✦
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "0.74rem", fontWeight: 700, lineHeight: 1.2,
                  color: isAgency ? "#F9A8D4" : "#A5B4FC",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}>
                  Plan {plan === "AGENCY" ? "Agence" : "Pro"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--clr-muted)", lineHeight: 1.3, marginTop: 1 }}>
                  Gérer l&apos;abonnement
                </div>
              </div>
            </Link>
          )}

          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 10,
            fontSize: "0.8rem", fontWeight: 500, color: "var(--clr-muted)",
            transition: "var(--transition)", textDecoration: "none",
          }}>
            <BackIcon />
            Retour au site
          </Link>

          {/* User avatar + plan badge */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginTop: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#7C5CFC,#F06292)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: 800, color: "#fff",
                position: "relative",
              }}>
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                {isPaid && (
                  <span
                    title={isAgency ? "Plan Agence" : "Plan Pro"}
                    style={{
                      position: "absolute",
                      bottom: -3,
                      right: -3,
                      minWidth: 16, height: 16,
                      padding: "0 4px",
                      borderRadius: 8,
                      background: isAgency
                        ? "linear-gradient(135deg, #F472B6, #C084FC)"
                        : "linear-gradient(135deg, #67E8F9, #818CF8)",
                      border: "1.5px solid #0D0D14",
                      color: "#06070B",
                      fontSize: "0.55rem",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {isAgency ? "AG" : "PRO"}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontSize: "0.7rem", color: "var(--clr-muted)",
                    cursor: "pointer", fontFamily: "var(--font)",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--clr-danger)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--clr-muted)")}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
        {/* Topbar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10, height: 64,
          borderBottom: "1px solid var(--line-2)",
          display: "flex", alignItems: "center", padding: "0 24px", gap: 12,
          background: "rgba(11,13,20,0.78)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}>
          {/* Hamburger — visible only on mobile */}
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="app-mobile-only"
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--line-2)",
              color: "var(--text-1)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Search/Command trigger — desktop only */}
          <button
            type="button"
            className="app-desktop-only"
            onClick={() => {
              // Déclenche l'événement clavier ⌘K pour ouvrir la palette
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 10px 7px 12px",
              borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--line-2)",
              color: "var(--text-3)",
              fontSize: "0.84rem",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              minWidth: 220,
              transition: "all 160ms var(--ease-snap)",
              letterSpacing: "-0.003em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--line-3)"
              e.currentTarget.style.color = "var(--text-2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--line-2)"
              e.currentTarget.style.color = "var(--text-3)"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span style={{ flex: 1, textAlign: "left" }}>Chercher ou commande…</span>
            <kbd
              style={{
                padding: "2px 6px",
                fontSize: "0.66rem",
                color: "var(--text-3)",
                background: "var(--surface-3)",
                border: "1px solid var(--line-2)",
                borderRadius: 5,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
                lineHeight: 1.4,
              }}
            >
              ⌘K
            </kbd>
          </button>

          <div style={{ flex: 1 }} />

          <Link
            href="/compose"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px 8px 14px", borderRadius: 10,
              background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
              color: "#fff", fontSize: "0.84rem", fontWeight: 500,
              boxShadow: "0 1px 0 0 rgba(255,255,255,0.14) inset, 0 0 0 1px rgba(99,102,241,0.35), 0 6px 18px -6px rgba(79,70,229,0.45)",
              textDecoration: "none",
              letterSpacing: "-0.005em",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouveau post
          </Link>
        </div>

        {children}
      </main>

      <CommandPalette />
    </div>
  );
}
