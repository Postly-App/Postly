/**
 * Postly — Motion primitives "Mission Control"
 *
 * Easings calibrés sur les apps premium (Apple, Linear, Framer, Stripe).
 * Pas d'animations gimmicky : mouvements courts, courbes asymétriques,
 * stagger discret. Le but est l'intentionnalité, pas le bruit visuel.
 */

import type { Transition, Variants } from "framer-motion"

/* ─────────────────────────────────────────────
   COURBES (cubic-bezier)
   ───────────────────────────────────────────── */

export const EASE = {
  /** Apple spring touch — interactions tactiles, navigation entre vues */
  spring: [0.32, 0.72, 0, 1] as const,
  /** Out-expo — entrées d'éléments venant de loin (hero, modals) */
  outExpo: [0.22, 1, 0.36, 1] as const,
  /** Out-quart — entrées plus douces (listes, cards) */
  outQuart: [0.25, 1, 0.5, 1] as const,
  /** Snap — UI réactive (boutons, hover state continus) */
  snap: [0.16, 1, 0.3, 1] as const,
  /** In-out — éléments persistants qui bougent (carrousel) */
  inOut: [0.45, 0, 0.55, 1] as const,
}

/* ─────────────────────────────────────────────
   DURÉES (ms / s pour framer)
   ───────────────────────────────────────────── */

export const DUR = {
  fast: 0.18,      // micro hover, tooltip
  base: 0.28,      // boutons, ouverture
  med: 0.45,       // entrées d'éléments
  slow: 0.72,      // reveals importants
  cinematic: 1.1,  // hero, page transitions majeures
} as const

/* ─────────────────────────────────────────────
   VARIANTS RÉUTILISABLES
   ───────────────────────────────────────────── */

/** Fade + translation Y discrète. Pour entrées de section. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.med, ease: EASE.outExpo },
  },
}

/** Plus marquée que fadeUp, pour Hero / titres. */
export const fadeUpHero: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, ease: EASE.outExpo },
  },
}

/** Apparition latérale (sidebar, cards en grille). */
export const slideRight: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DUR.med, ease: EASE.outQuart },
  },
}

/** Scale subtile — pour boutons CTA, modals, popovers. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DUR.base, ease: EASE.spring },
  },
}

/** Container stagger — anime ses enfants en cascade (60ms entre chaque). */
export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
}

/** Container stagger lent — pour grandes listes / sections multiples. */
export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
}

/* ─────────────────────────────────────────────
   TRANSITIONS PRÉ-CONFIGURÉES
   ───────────────────────────────────────────── */

export const tx = {
  /** Transition standard fluide. */
  smooth: { duration: DUR.base, ease: EASE.outQuart } as Transition,
  /** Transition rapide pour micro-interactions. */
  fast: { duration: DUR.fast, ease: EASE.snap } as Transition,
  /** Spring physique réaliste (boutons, drag). */
  spring: { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.8 },
  /** Spring très réactif (toasts, popovers). */
  springSnap: { type: "spring" as const, stiffness: 500, damping: 36, mass: 0.6 },
  /** Spring doux (modals, gros éléments). */
  springSoft: { type: "spring" as const, stiffness: 260, damping: 30, mass: 1 },
}

/* ─────────────────────────────────────────────
   VIEWPORT — config standard pour whileInView
   ───────────────────────────────────────────── */

export const viewport = {
  /** Déclenche quand 15% de l'élément est visible. Ne rejoue pas. */
  default: { once: true, amount: 0.15 },
  /** Déclenche plus tard (40% visible). Pour hero/grandes sections. */
  late: { once: true, amount: 0.4 },
}

/* ─────────────────────────────────────────────
   HOVER / TAP — micro-interactions cohérentes
   ───────────────────────────────────────────── */

export const hoverLift = {
  whileHover: { y: -2, transition: tx.fast },
  whileTap: { y: 0, scale: 0.985, transition: tx.fast },
}

export const hoverScale = {
  whileHover: { scale: 1.02, transition: tx.fast },
  whileTap: { scale: 0.97, transition: tx.fast },
}

/* ─────────────────────────────────────────────
   CYBERPUNK / NEON — premium futurist
   ───────────────────────────────────────────── */

/** Backdrop pour le focus mode (blur progressif + scrim). */
export const focusBackdrop: Variants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: {
    opacity: 1,
    backdropFilter: "blur(20px)",
    transition: { duration: DUR.med, ease: EASE.outQuart },
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: DUR.base, ease: EASE.outQuart },
  },
}

/** Card morphing — utilisé avec layoutId. La transition de layout est gérée par framer. */
export const focusedCard: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.med, ease: EASE.outExpo, delay: 0.05 },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DUR.base, ease: EASE.outQuart },
  },
}

/** Pulse néon — décoration de bordure/glow qui respire. */
export const neonPulse: Variants = {
  initial: { opacity: 0.4 },
  animate: {
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 3.2,
      ease: EASE.inOut,
      repeat: Infinity,
    },
  },
}

/** Animation d'entrée d'un titre néon — fade + shift latéral imperceptible. */
export const neonTitleIn: Variants = {
  hidden: { opacity: 0, x: -4, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: DUR.slow, ease: EASE.outExpo },
  },
}

/** Glow trail — pour un curseur ou particle qui suit le mouvement. */
export const glowTrail = {
  type: "spring" as const,
  stiffness: 280,
  damping: 28,
  mass: 0.6,
}
