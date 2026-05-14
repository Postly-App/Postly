"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import {
  LayoutDashboard,
  PenLine,
  BarChart3,
  Link2,
  Settings,
  CreditCard,
  Users,
  Building2,
  Key,
  Database,
  LogOut,
  Search,
  Plus,
  Sparkles,
} from "lucide-react"
import { EASE, DUR } from "@/lib/motion"

interface Command {
  id: string
  label: string
  shortcut?: string
  group: "Navigation" | "Actions" | "Compte"
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  run: () => void
  keywords?: string[]
}

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Définition des commandes — déclarative, simple à étendre
  const commands: Command[] = useMemo(() => {
    const go = (href: string) => () => {
      setOpen(false)
      router.push(href)
    }
    return [
      // Navigation
      { id: "nav-dashboard", label: "Aller au dashboard", group: "Navigation", icon: LayoutDashboard, run: go("/dashboard"), keywords: ["home", "accueil"] },
      { id: "nav-compose", label: "Nouveau post / Studio", group: "Navigation", icon: PenLine, run: go("/compose"), keywords: ["créer", "écrire", "publier"] },
      { id: "nav-analytics", label: "Analytics", group: "Navigation", icon: BarChart3, run: go("/analytics"), keywords: ["stats", "perf", "kpi"] },
      { id: "nav-accounts", label: "Comptes connectés", group: "Navigation", icon: Link2, run: go("/settings") },
      { id: "nav-clients", label: "Clients (Agence)", group: "Navigation", icon: Building2, run: go("/clients") },
      { id: "nav-team", label: "Équipe", group: "Navigation", icon: Users, run: go("/settings/team") },
      { id: "nav-apikeys", label: "Clés API", group: "Navigation", icon: Key, run: go("/settings/api-keys") },
      { id: "nav-billing", label: "Facturation", group: "Navigation", icon: CreditCard, run: go("/billing") },
      { id: "nav-settings", label: "Paramètres", group: "Navigation", icon: Settings, run: go("/settings") },
      { id: "nav-data", label: "Mes données (RGPD)", group: "Navigation", icon: Database, run: go("/settings/data") },
      // Actions
      { id: "act-new-post", label: "Créer un nouveau post", group: "Actions", icon: Plus, run: go("/compose"), shortcut: "C" },
      { id: "act-ai", label: "Demander à l'assistant IA", group: "Actions", icon: Sparkles, run: () => { setOpen(false); window.dispatchEvent(new Event("postly:openAssistant")) } },
      // Compte
      {
        id: "compte-signout",
        label: "Se déconnecter",
        group: "Compte",
        icon: LogOut,
        run: async () => {
          setOpen(false)
          await signOut({ callbackUrl: "/" })
        },
      },
    ]
  }, [router])

  // Filtre des commandes selon la query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase().trim()
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.keywords?.some((k) => k.toLowerCase().includes(q))
    )
  }, [commands, query])

  // Groupement
  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filtered.forEach((c) => {
      groups[c.group] = groups[c.group] || []
      groups[c.group].push(c)
    })
    return groups
  }, [filtered])

  // Toggle clavier ⌘K / Ctrl+K + Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === "Escape" && open) {
        setOpen(false)
      } else if (open) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setActive((a) => Math.min(a + 1, filtered.length - 1))
        } else if (e.key === "ArrowUp") {
          e.preventDefault()
          setActive((a) => Math.max(a - 1, 0))
        } else if (e.key === "Enter") {
          e.preventDefault()
          filtered[active]?.run()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, filtered, active])

  // Reset state à l'ouverture
  useEffect(() => {
    if (open) {
      setQuery("")
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  // Reset active quand query change
  useEffect(() => {
    setActive(0)
  }, [query])

  // Scroll auto sur l'item actif
  useEffect(() => {
    if (!open || !listRef.current) return
    const items = listRef.current.querySelectorAll("[data-cmd-item]")
    items[active]?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [active, open])

  let runningIdx = 0

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.base, ease: EASE.outQuart }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(3,5,11,0.65)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                zIndex: 9000,
              }}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: DUR.base, ease: EASE.spring }}
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              style={{
                position: "fixed",
                top: "min(15vh, 120px)",
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(640px, calc(100vw - 32px))",
                zIndex: 9001,
                background: "var(--surface-3)",
                border: "1px solid var(--line-3)",
                borderRadius: 16,
                boxShadow:
                  "0 1px 0 0 rgba(255,255,255,0.06) inset, " +
                  "0 24px 60px -20px rgba(0,0,0,0.7), " +
                  "0 8px 24px -8px rgba(0,0,0,0.5)",
                overflow: "hidden",
              }}
            >
              {/* Search input */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--line-2)",
                }}
              >
                <Search size={17} strokeWidth={1.75} color="var(--text-3)" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tape une commande ou cherche…"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--text-1)",
                    fontSize: "0.95rem",
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "-0.005em",
                  }}
                />
                <kbd
                  style={{
                    padding: "3px 8px",
                    fontSize: "0.7rem",
                    color: "var(--text-3)",
                    background: "var(--surface-2)",
                    border: "1px solid var(--line-2)",
                    borderRadius: 6,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  esc
                </kbd>
              </div>

              {/* Liste */}
              <div
                ref={listRef}
                style={{
                  maxHeight: "min(50vh, 420px)",
                  overflowY: "auto",
                  padding: "6px",
                }}
              >
                {filtered.length === 0 && (
                  <div style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "var(--text-3)",
                    fontSize: "0.88rem",
                  }}>
                    Aucun résultat pour <span style={{ color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>&laquo; {query} &raquo;</span>
                  </div>
                )}

                {Object.entries(grouped).map(([group, items]) => (
                  <div key={group}>
                    <div
                      style={{
                        padding: "10px 14px 6px",
                        fontSize: "0.68rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--text-4)",
                      }}
                    >
                      {group}
                    </div>
                    {items.map((c) => {
                      const idx = runningIdx++
                      const isActive = idx === active
                      const Icon = c.icon
                      return (
                        <button
                          key={c.id}
                          data-cmd-item
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => c.run()}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "none",
                            background: isActive ? "var(--surface-4)" : "transparent",
                            color: "var(--text-1)",
                            fontSize: "0.9rem",
                            fontFamily: "var(--font-sans)",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 120ms var(--ease-snap, ease)",
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isActive ? "rgba(99,102,241,0.16)" : "var(--surface-2)",
                              border: `1px solid ${isActive ? "rgba(99,102,241,0.28)" : "var(--line-2)"}`,
                              transition: "all 120ms var(--ease-snap, ease)",
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={14} strokeWidth={1.75} />
                          </div>
                          <span style={{ flex: 1, letterSpacing: "-0.005em" }}>{c.label}</span>
                          {c.shortcut && (
                            <kbd
                              style={{
                                padding: "2px 7px",
                                fontSize: "0.66rem",
                                color: "var(--text-3)",
                                background: "var(--surface-2)",
                                border: "1px solid var(--line-2)",
                                borderRadius: 5,
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {c.shortcut}
                            </kbd>
                          )}
                          {isActive && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-3)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              ↵
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  borderTop: "1px solid var(--line-2)",
                  background: "var(--surface-2)",
                  fontSize: "0.72rem",
                  color: "var(--text-3)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.01em",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "flex", gap: 3 }}>
                    <kbd style={kbdSmall}>↑</kbd>
                    <kbd style={kbdSmall}>↓</kbd>
                  </span>
                  naviguer
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <kbd style={kbdSmall}>↵</kbd>
                  sélectionner
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Postly
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

const kbdSmall: React.CSSProperties = {
  padding: "1px 5px",
  fontSize: "0.66rem",
  color: "var(--text-3)",
  background: "var(--surface-3)",
  border: "1px solid var(--line-2)",
  borderRadius: 4,
  fontFamily: "var(--font-mono)",
  lineHeight: 1.4,
}
