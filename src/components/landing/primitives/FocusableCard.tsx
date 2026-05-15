"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useState, useCallback, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { EASE, DUR } from "@/lib/motion"

interface FocusableCardProps {
  id: string
  className?: string
  children: ({ isOpen }: { isOpen: boolean }) => ReactNode
  expandedContent: ReactNode
  accent?: "indigo" | "cyan" | "magenta" | "emerald"
  style?: React.CSSProperties
}

const ACCENTS = {
  indigo:  { ring: "rgba(99,102,241,0.35)",  glow: "rgba(99,102,241,0.45)" },
  cyan:    { ring: "rgba(34,211,238,0.35)",  glow: "rgba(34,211,238,0.45)" },
  magenta: { ring: "rgba(244,114,182,0.35)", glow: "rgba(244,114,182,0.45)" },
  emerald: { ring: "rgba(52,211,153,0.35)",  glow: "rgba(52,211,153,0.45)" },
}

export default function FocusableCard({
  id,
  className,
  children,
  expandedContent,
  accent = "indigo",
  style,
}: FocusableCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const reduceMotion = useReducedMotion()
  const accentColors = ACCENTS[accent]

  useEffect(() => setMounted(true), [])

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return
    document.body.classList.add("focus-locked")
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.classList.remove("focus-locked")
      window.removeEventListener("keydown", onKey)
    }
  }, [isOpen, close])

  const layoutTransition = reduceMotion
    ? { duration: 0 }
    : { duration: DUR.med, ease: EASE.outExpo }

  return (
    <>
      {/* Collapsed card — sits in flow. Children hidden when modal is open
          to avoid duplicate visual during layoutId morph. */}
      <motion.button
        layoutId={`focus-card-${id}`}
        onClick={() => setIsOpen(true)}
        className={className}
        transition={layoutTransition}
        whileHover={reduceMotion || isOpen ? undefined : { y: -3 }}
        whileTap={reduceMotion || isOpen ? undefined : { scale: 0.985 }}
        style={{
          textAlign: "left",
          cursor: isOpen ? "default" : "pointer",
          font: "inherit",
          color: "inherit",
          width: "100%",
          height: "100%",
          padding: 0,
          border: 0,
          background: "transparent",
          ...style,
        }}
      >
        <div style={{ visibility: isOpen ? "hidden" : "visible", height: "100%" }}>
          {children({ isOpen: false })}
        </div>
      </motion.button>

      {/* Focus modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.base, ease: EASE.outQuart }}
                onClick={close}
                className="focus-backdrop"
              />
              <div className="focus-modal-wrap">
                <motion.div
                  layoutId={`focus-card-${id}`}
                  transition={layoutTransition}
                  style={{
                    width: "min(720px, 100%)",
                    maxHeight: "calc(100vh - 48px)",
                    overflowY: "auto",
                    background: "linear-gradient(180deg, rgba(14,16,24,0.95), rgba(11,13,20,0.98))",
                    border: `1px solid ${accentColors.ring}`,
                    borderRadius: 24,
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    boxShadow:
                      "0 1px 0 0 rgba(255,255,255,0.06) inset, " +
                      `0 0 0 1px ${accentColors.ring}, ` +
                      `0 40px 80px -20px ${accentColors.glow}, ` +
                      "0 60px 120px -30px rgba(0,0,0,0.8)",
                    position: "relative",
                  }}
                >
                  {/* Close button */}
                  <motion.button
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: DUR.base, ease: EASE.spring }}
                    onClick={close}
                    aria-label="Fermer"
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--line-2)",
                      color: "var(--text-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      zIndex: 2,
                    }}
                  >
                    <X size={16} strokeWidth={2} />
                  </motion.button>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: 0.08, duration: DUR.med, ease: EASE.outExpo }}
                    style={{ padding: "40px 36px" }}
                  >
                    {expandedContent}
                  </motion.div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
