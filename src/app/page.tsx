"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import MagneticLink from "@/components/cinematic/MagneticLink";
import TiltCard from "@/components/cinematic/TiltCard";
import Marquee from "@/components/cinematic/Marquee";
import BootSplash from "@/components/cinematic/BootSplash";
import LenisProvider from "@/components/cinematic/LenisProvider";
import CustomCursor from "@/components/cinematic/CustomCursor";
import LandingChatWidget from "@/components/landing/LandingChatWidget";
import CityVideoBackground from "@/components/landing/CityVideoBackground";
import HeroPhoneMockup from "@/components/landing/HeroPhoneMockup";
import HeroStatsBar from "@/components/landing/HeroStatsBar";
import FocusableCard from "@/components/landing/primitives/FocusableCard";
import NeonText from "@/components/landing/primitives/NeonText";
import ScanlineOverlay from "@/components/effects/ScanlineOverlay";
import CursorGlow from "@/components/effects/CursorGlow";
import {
  ArrowUpRight, Play, CalendarClock, Sparkles, LineChart,
  Check, Crown, Users, User, Briefcase, Zap, BarChart3, Hash, Calendar, Image as ImageIcon, MessageSquare,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  useScrollProgress();
  useScrollReveal();

  return (
    <LenisProvider>
      <CustomCursor />
      <div className="relative min-h-screen overflow-x-hidden" style={{ color: "var(--clr-text)" }}>
      <BootSplash />

      {/* Vue aérienne ville nuit — vidéo self-hostée avec poster LCP-instant */}
      <CityVideoBackground />

      {/* Cyberpunk overlays — scanlines + halo curseur */}
      <CursorGlow />
      <ScanlineOverlay />

      <div id="scroll-progress" aria-hidden="true" />

      <div style={{ position: "relative", zIndex: 3 }}>
        <TopNav />
        <HeroSection />
        <Marquee />
        <FeaturesSection />
        <HowItWorks />
        <UseCasesSection />
        <PricingSection />
        <ComparisonTeaserSection />
        <CTASection />
        <FooterSection />
        <LandingChatWidget />
      </div>
      </div>
    </LenisProvider>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════ */
function useScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${pct})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════════════════════
   TOP NAV — glass with progressive blur
═══════════════════════════════════════════════════════════ */
function TopNav() {
  return (
    <nav
      id="topnav"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: "64px",
        background: "linear-gradient(180deg, rgba(8,8,15,0.85), rgba(8,8,15,0.55))",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <Logo size={32} />

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Link href="/compare" style={{
          padding: "6px 16px", borderRadius: 10, fontSize: "0.875rem", fontWeight: 500,
          color: "var(--clr-muted)", transition: "var(--transition)",
        }}
          className="nav-link-hover"
        >Comparer</Link>
        <Link href="/contact" style={{
          padding: "6px 16px", borderRadius: 10, fontSize: "0.875rem", fontWeight: 500,
          color: "var(--clr-muted)", transition: "var(--transition)",
        }}
          className="nav-link-hover"
        >Contact</Link>
        <Link href="/pricing" style={{
          padding: "6px 16px", borderRadius: 10, fontSize: "0.875rem", fontWeight: 500,
          color: "var(--clr-muted)", transition: "var(--transition)",
        }}
          className="nav-link-hover"
        >Tarifs</Link>
        <Link href="/login" style={{
          padding: "8px 18px", borderRadius: 12, fontSize: "0.875rem", fontWeight: 600,
          background: "rgba(255,255,255,0.05)", color: "var(--clr-text)",
          border: "1px solid var(--clr-border)", transition: "var(--transition)",
        }}>Se connecter</Link>
        <MagneticLink
          href="/signup"
          strength={14}
          style={{
            padding: "8px 22px", borderRadius: 12, fontSize: "0.875rem", fontWeight: 700,
            background: "linear-gradient(135deg,var(--clr-primary),#5B3EE8)", color: "#fff",
            boxShadow: "0 0 22px rgba(124,92,252,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >Commencer →</MagneticLink>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════ */
function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yContent = useSpring(useTransform(scrollYProgress, [0, 1], [0, -80]), { stiffness: 80, damping: 22 });
  const opacityHero = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "140px 0 60px",
        minHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      {/* Contenu hero (le background est rendu au niveau page root) */}
      <motion.div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          width: "100%",
          y: yContent,
          opacity: opacityHero,
          willChange: "transform",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 48,
            alignItems: "center",
          }}
          className="hero-grid"
        >
          {/* ─── Colonne texte ─── */}
          <div style={{ minWidth: 0 }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px 5px 10px",
                borderRadius: 100,
                background: "rgba(99,102,241,0.10)",
                border: "1px solid rgba(99,102,241,0.28)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                fontSize: "0.74rem",
                fontWeight: 600,
                color: "#A5B4FC",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: 28,
              }}
            >
              <Play size={11} fill="#A5B4FC" strokeWidth={0} />
              Programmation multi-réseaux · Assistant IA inclus
            </motion.div>

            {/* H1 — Neon text avec drop-shadow glow */}
            <motion.h1
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, delay: 0.08, ease: EASE }}
              style={{
                fontSize: "clamp(2.4rem, 5.8vw, 4.4rem)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 1.02,
                marginBottom: 22,
                color: "var(--text-1)",
              }}
            >
              Publiez. Analysez.
              <br />
              <NeonText variant="indigo" as="span" scrollChroma>
                Développez.
              </NeonText>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.18, ease: EASE }}
              style={{
                fontSize: "1.1rem",
                color: "var(--text-3)",
                maxWidth: 540,
                lineHeight: 1.6,
                marginBottom: 36,
                letterSpacing: "-0.005em",
              }}
            >
              Programmez vos contenus, générez vos légendes avec l&apos;IA
              et suivez vos performances sur 7 réseaux — depuis une seule
              interface, pensée pour les créateurs, freelances et équipes
              marketing.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
              style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}
            >
              <MagneticLink
                href="/signup"
                strength={14}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  borderRadius: 14,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#fff",
                  background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
                  boxShadow:
                    "0 1px 0 0 rgba(255,255,255,0.18) inset, " +
                    "0 0 0 1px rgba(99,102,241,0.4), " +
                    "0 12px 32px -8px rgba(79,70,229,0.55), " +
                    "0 0 60px -10px rgba(99,102,241,0.4)",
                  letterSpacing: "-0.005em",
                }}
              >
                Commencer gratuitement
                <ArrowUpRight size={16} strokeWidth={2.2} />
              </MagneticLink>
              <MagneticLink
                href="/signup?from=demo"
                strength={10}
                aria-label="Voir une démo — inscription gratuite requise"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 22px 14px 16px",
                  borderRadius: 14,
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "var(--text-1)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--line-3)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  letterSpacing: "-0.005em",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.10)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Play size={11} fill="currentColor" strokeWidth={0} style={{ marginLeft: 2 }} />
                </div>
                Voir une démo
              </MagneticLink>
            </motion.div>

          </div>

          {/* ─── Colonne phone mockup (desktop seulement) ─── */}
          <div className="hero-phone-wrap" style={{ display: "flex", justifyContent: "center" }}>
            <HeroPhoneMockup />
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ marginTop: 56 }}>
          <HeroStatsBar />
        </div>
      </motion.div>

      <style jsx>{`
        @media (max-width: 1023px) {
          :global(.hero-grid) {
            grid-template-columns: 1fr !important;
          }
          :global(.hero-phone-wrap) {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FEATURES — FocusableCard (click → immersive focus mode)
═══════════════════════════════════════════════════════════ */
type FeatureAccent = "indigo" | "cyan" | "emerald" | "magenta";
interface Feature {
  id: string;
  Icon: typeof CalendarClock;
  accent: FeatureAccent;
  tint: string;
  ring: string;
  iconColor: string;
  title: string;
  desc: string;
  highlight: string;
  bullets: { Icon: typeof CalendarClock; label: string; sub: string }[];
}

function FeaturesSection() {
  const features: Feature[] = [
    {
      id: "feat-schedule",
      Icon: CalendarClock,
      accent: "indigo",
      tint: "rgba(99,102,241,0.18)",
      ring: "rgba(99,102,241,0.32)",
      iconColor: "#A5B4FC",
      title: "Planification intelligente",
      desc: "Programme tes publications à l'avance sur tous tes réseaux. L'IA identifie les meilleurs moments pour maximiser ta portée.",
      highlight: "Programmez à la seconde près sur 7 plateformes — sans jamais ouvrir une seconde app.",
      bullets: [
        { Icon: Calendar,     label: "Calendrier visuel",   sub: "Glissez-déposez vos posts, prévisualisez par semaine ou mois." },
        { Icon: Zap,          label: "Meilleurs créneaux",  sub: "Notre IA analyse votre audience et suggère l'heure optimale." },
        { Icon: ImageIcon,    label: "File d'attente",      sub: "Ajoutez du contenu à la queue, on publie quand c'est l'heure." },
        { Icon: BarChart3,    label: "Rapports auto",       sub: "Recevez par email les perfs hebdo de tout votre calendrier." },
      ],
    },
    {
      id: "feat-ai",
      Icon: Sparkles,
      accent: "cyan",
      tint: "rgba(6,182,212,0.16)",
      ring: "rgba(6,182,212,0.30)",
      iconColor: "#67E8F9",
      title: "Assistant IA intégré",
      desc: "Génère des légendes percutantes, suggestions de hashtags et analyse de ton — tout depuis ton cockpit, sans changer d'outil.",
      highlight: "Du brief vide à un post optimisé en 8 secondes — pour chaque plateforme.",
      bullets: [
        { Icon: MessageSquare, label: "Légendes adaptatives", sub: "Ton, longueur et émojis ajustés par plateforme automatiquement." },
        { Icon: Hash,          label: "Hashtags pertinents", sub: "10–30 hashtags choisis selon votre niche et la tendance du moment." },
        { Icon: Sparkles,      label: "Idées de contenu",    sub: "Bloqué·e ? Donnez un sujet, l'IA propose 5 angles différents." },
        { Icon: BarChart3,     label: "Analyse de ton",      sub: "Vérifiez la cohérence de voix avec votre identité de marque." },
      ],
    },
    {
      id: "feat-analytics",
      Icon: LineChart,
      accent: "emerald",
      tint: "rgba(52,211,153,0.16)",
      ring: "rgba(52,211,153,0.30)",
      iconColor: "#6EE7B7",
      title: "Analytics détaillés",
      desc: "Suivis temps réel, identification des meilleurs contenus et rapports visuels exportables. Prends des décisions basées sur la donnée.",
      highlight: "Un dashboard unifié pour tous vos réseaux — chiffres clairs, décisions rapides.",
      bullets: [
        { Icon: BarChart3,    label: "Dashboard unifié",   sub: "Reach, engagement, croissance — toutes plateformes au même endroit." },
        { Icon: LineChart,    label: "Comparaison",        sub: "Voyez quelle plateforme performe le mieux pour votre contenu." },
        { Icon: Sparkles,     label: "Top performers",     sub: "L'algo identifie automatiquement vos posts qui ont décollé." },
        { Icon: ImageIcon,    label: "Exports PDF",        sub: "Rapports white-label pour clients ou direction, en un clic." },
      ],
    },
  ];

  return (
    <section id="features" style={{ padding: "120px 0", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center" }}>
          <SectionLabel>Fonctionnalités</SectionLabel>
          <SectionTitle>Tout ce dont vous avez <NeonText variant="indigo">besoin</NeonText></SectionTitle>
          <SectionSub>Cliquez sur une carte pour explorer en profondeur. Des outils pensés pour les créateurs et équipes marketing ambitieuses.</SectionSub>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: 24, marginTop: 60,
          }}
        >
          {features.map((f) => (
            <motion.div
              key={f.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
            >
              <FocusableCard
                id={f.id}
                accent={f.accent}
                expandedContent={<FeatureExpanded f={f} />}
              >
                {() => <FeatureCardInner f={f} />}
              </FocusableCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCardInner({ f }: { f: Feature }) {
  const Icon = f.Icon;
  return (
    <div
      className="glass-card glass-card-neon"
      style={{
        padding: "32px 28px",
        height: "100%",
        position: "relative",
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 22,
        background: f.tint,
        border: `1px solid ${f.ring}`,
        boxShadow: `0 1px 0 0 rgba(255,255,255,0.06) inset, 0 0 32px -4px ${f.ring}`,
      }}>
        <Icon size={22} strokeWidth={1.5} color={f.iconColor} />
      </div>
      <h3 style={{
        fontSize: "1.12rem",
        fontWeight: 600,
        marginBottom: 8,
        letterSpacing: "-0.015em",
        color: "var(--text-1)",
      }}>{f.title}</h3>
      <p style={{
        color: "var(--text-3)",
        fontSize: "0.92rem",
        lineHeight: 1.6,
        letterSpacing: "-0.003em",
        marginBottom: 18,
      }}>{f.desc}</p>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: "0.78rem",
        fontWeight: 600,
        color: f.iconColor,
        letterSpacing: "-0.005em",
      }}>
        Explorer
        <ArrowUpRight size={13} strokeWidth={2.2} />
      </div>
    </div>
  );
}

function FeatureExpanded({ f }: { f: Feature }) {
  const Icon = f.Icon;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: f.tint, border: `1px solid ${f.ring}`,
          boxShadow: `0 0 40px -4px ${f.ring}`,
        }}>
          <Icon size={26} strokeWidth={1.5} color={f.iconColor} />
        </div>
        <div>
          <h2 style={{
            fontSize: "1.55rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-1)",
            lineHeight: 1.1,
          }}>{f.title}</h2>
        </div>
      </div>

      <p style={{
        fontSize: "1.08rem",
        color: "var(--text-2)",
        lineHeight: 1.55,
        letterSpacing: "-0.005em",
        marginBottom: 28,
        fontWeight: 500,
      }}>
        {f.highlight}
      </p>

      <div className="neon-divider" style={{ marginBottom: 28 }} />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 18,
        marginBottom: 32,
      }}>
        {f.bullets.map((b) => {
          const BIcon = b.Icon;
          return (
            <div key={b.label} style={{
              padding: "16px 18px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--line-2)",
              borderRadius: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <BIcon size={15} strokeWidth={1.75} color={f.iconColor} />
                <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-1)" }}>{b.label}</div>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-3)", lineHeight: 1.5 }}>{b.sub}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/signup" className="glow-btn" style={{
          padding: "12px 24px",
          borderRadius: 12,
          fontWeight: 600,
          fontSize: "0.92rem",
          background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
          color: "#fff",
          boxShadow: "0 0 0 1px rgba(99,102,241,0.4), 0 12px 32px -8px rgba(79,70,229,0.55)",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          Essayer gratuitement <ArrowUpRight size={15} strokeWidth={2.2} />
        </Link>
        <Link href="/pricing" style={{
          padding: "12px 22px",
          borderRadius: 12,
          fontWeight: 500,
          fontSize: "0.92rem",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line-3)",
          color: "var(--text-1)",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          Voir les tarifs
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   USE CASES — Pour qui c'est ? (FocusableCard)
═══════════════════════════════════════════════════════════ */
type UseCaseAccent = "indigo" | "cyan" | "magenta";
interface UseCase {
  id: string;
  Icon: typeof User;
  accent: UseCaseAccent;
  tint: string;
  ring: string;
  iconColor: string;
  badge: string;
  title: string;
  punch: string;
  desc: string;
  bullets: string[];
  plan: string;
}

function UseCasesSection() {
  const cases: UseCase[] = [
    {
      id: "case-solo",
      Icon: User,
      accent: "indigo",
      tint: "rgba(99,102,241,0.16)",
      ring: "rgba(99,102,241,0.30)",
      iconColor: "#A5B4FC",
      badge: "Créateur solo",
      title: "Pour les créateurs indépendants",
      punch: "Concentrez-vous sur la création, on s'occupe du reste.",
      desc: "Vous êtes seul·e à gérer votre marque personnelle ou votre petit business. Pas de temps à perdre sur le micro-management de chaque plateforme.",
      bullets: [
        "Postly génère vos légendes en fonction de votre voix",
        "Calendrier visuel pour planifier 1 mois en 30 minutes",
        "Insights condensés : juste les chiffres qui comptent",
        "Une seule app au lieu de 5 onglets ouverts en permanence",
      ],
      plan: "Recommandé : plan Free ou Pro",
    },
    {
      id: "case-team",
      Icon: Briefcase,
      accent: "cyan",
      tint: "rgba(6,182,212,0.14)",
      ring: "rgba(6,182,212,0.28)",
      iconColor: "#67E8F9",
      badge: "Équipe marketing",
      title: "Pour les PME & équipes marketing",
      punch: "Toute l'équipe alignée, zéro post oublié, des décisions data-driven.",
      desc: "Une équipe de 2 à 10, gérant la présence digitale d'une marque sur 4+ plateformes. Besoin de cohérence et de reporting clair.",
      bullets: [
        "Brand kit centralisé : couleurs, ton, mots-clés interdits",
        "Workflow d'approbation avant publication (si activé)",
        "Calendrier partagé temps réel — fini les conflits Slack",
        "Rapports PDF mensuels exportables pour la direction",
      ],
      plan: "Recommandé : plan Pro",
    },
    {
      id: "case-agency",
      Icon: Users,
      accent: "magenta",
      tint: "rgba(244,114,182,0.14)",
      ring: "rgba(244,114,182,0.30)",
      iconColor: "#F9A8D4",
      badge: "Agence",
      title: "Pour les agences sociales",
      punch: "Gérez 5, 20 ou 100 clients depuis un cockpit unique. White-label inclus.",
      desc: "Vous gérez plusieurs clients en parallèle. Vous facturez votre valeur — Postly vous rend opérationnellement scalable sans embaucher.",
      bullets: [
        "Espaces clients isolés avec branding personnalisé",
        "API pour intégrer votre stack interne (CRM, billing, etc.)",
        "Rapports PDF white-label avec votre logo",
        "Quotas configurables, équipe avec rôles granulaires",
      ],
      plan: "Recommandé : plan Agency",
    },
  ];

  return (
    <section id="use-cases" style={{ padding: "120px 0", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center" }}>
          <SectionLabel>Pour qui</SectionLabel>
          <SectionTitle>Quel que soit votre <NeonText variant="cyan">profil</NeonText></SectionTitle>
          <SectionSub>De la création solo à l&apos;agence multi-clients, Postly s&apos;adapte. Cliquez pour découvrir l&apos;expérience qui vous correspond.</SectionSub>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 24,
            marginTop: 60,
          }}
        >
          {cases.map((c) => (
            <motion.div
              key={c.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
            >
              <FocusableCard
                id={c.id}
                accent={c.accent}
                expandedContent={<UseCaseExpanded c={c} />}
              >
                {() => <UseCaseCardInner c={c} />}
              </FocusableCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function UseCaseCardInner({ c }: { c: UseCase }) {
  const Icon = c.Icon;
  return (
    <div className="glass-card glass-card-neon" style={{ padding: "32px 28px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: c.tint,
          border: `1px solid ${c.ring}`,
          boxShadow: `0 0 24px -4px ${c.ring}`,
        }}>
          <Icon size={20} strokeWidth={1.5} color={c.iconColor} />
        </div>
        <span style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: c.iconColor,
          padding: "4px 10px",
          background: c.tint,
          border: `1px solid ${c.ring}`,
          borderRadius: 99,
        }}>
          {c.badge}
        </span>
      </div>
      <h3 style={{
        fontSize: "1.1rem",
        fontWeight: 600,
        marginBottom: 10,
        letterSpacing: "-0.015em",
        color: "var(--text-1)",
        lineHeight: 1.25,
      }}>{c.title}</h3>
      <p style={{
        color: "var(--text-3)",
        fontSize: "0.9rem",
        lineHeight: 1.6,
        marginBottom: 16,
      }}>{c.punch}</p>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: "0.78rem", fontWeight: 600,
        color: c.iconColor,
      }}>
        Voir le détail <ArrowUpRight size={13} strokeWidth={2.2} />
      </div>
    </div>
  );
}

function UseCaseExpanded({ c }: { c: UseCase }) {
  const Icon = c.Icon;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: c.tint, border: `1px solid ${c.ring}`,
          boxShadow: `0 0 40px -4px ${c.ring}`,
        }}>
          <Icon size={26} strokeWidth={1.5} color={c.iconColor} />
        </div>
        <div>
          <div style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: c.iconColor,
            marginBottom: 4,
          }}>{c.badge}</div>
          <h2 style={{
            fontSize: "1.45rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-1)",
            lineHeight: 1.15,
          }}>{c.title}</h2>
        </div>
      </div>

      <p style={{
        fontSize: "1.05rem",
        color: "var(--text-2)",
        lineHeight: 1.55,
        marginBottom: 18,
        fontWeight: 500,
      }}>{c.punch}</p>

      <p style={{
        fontSize: "0.96rem",
        color: "var(--text-3)",
        lineHeight: 1.65,
        marginBottom: 22,
      }}>{c.desc}</p>

      <div className="neon-divider" style={{ marginBottom: 22 }} />

      <ul style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {c.bullets.map((b) => (
          <li key={b} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 22, height: 22, flexShrink: 0,
              borderRadius: 7, marginTop: 1,
              background: c.tint,
              border: `1px solid ${c.ring}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={11} strokeWidth={2.5} color={c.iconColor} />
            </div>
            <span style={{ color: "var(--text-2)", fontSize: "0.94rem", lineHeight: 1.55 }}>{b}</span>
          </li>
        ))}
      </ul>

      <div style={{
        padding: "14px 18px",
        background: c.tint,
        border: `1px solid ${c.ring}`,
        borderRadius: 12,
        marginBottom: 24,
        fontSize: "0.85rem",
        color: c.iconColor,
        fontWeight: 600,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Crown size={15} strokeWidth={2} /> {c.plan}
      </div>

      <Link href="/signup" className="glow-btn" style={{
        padding: "12px 24px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: "0.92rem",
        background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
        color: "#fff",
        boxShadow: "0 0 0 1px rgba(99,102,241,0.4), 0 12px 32px -8px rgba(79,70,229,0.55)",
        display: "inline-flex", alignItems: "center", gap: 8,
      }}>
        Commencer mon essai <ArrowUpRight size={15} strokeWidth={2.2} />
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRICING — 3 plans, focus mode pour détails
═══════════════════════════════════════════════════════════ */
type PlanAccent = "indigo" | "cyan" | "magenta";
interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  desc: string;
  accent: PlanAccent;
  tint: string;
  ring: string;
  iconColor: string;
  featured?: boolean;
  features: string[];
  detailed: { category: string; items: string[] }[];
}

function PricingSection() {
  const plans: Plan[] = [
    {
      id: "plan-free",
      name: "Free",
      price: "0€",
      period: "à vie",
      tagline: "Pour démarrer sans engagement",
      desc: "Tout ce qu'il faut pour tester Postly et planifier vos premiers posts.",
      accent: "indigo",
      tint: "rgba(99,102,241,0.14)",
      ring: "rgba(99,102,241,0.28)",
      iconColor: "#A5B4FC",
      features: [
        "3 comptes sociaux",
        "10 publications par mois",
        "Programmation jusqu'à 7 jours",
        "Analytics basiques",
      ],
      detailed: [
        { category: "Publication", items: ["3 comptes sociaux connectés", "10 posts/mois max", "Programmation 7 jours d'avance"] },
        { category: "Création", items: ["Éditeur basique", "Upload d'images", "Pas d'IA incluse"] },
        { category: "Analytics", items: ["Vue d'ensemble", "Reach + engagement", "Pas d'export PDF"] },
        { category: "Support", items: ["Email standard (72h)", "Centre d'aide"] },
      ],
    },
    {
      id: "plan-pro",
      name: "Pro",
      price: "19€",
      period: "/ mois",
      tagline: "Pour les créateurs sérieux",
      desc: "L'IA, des analytics avancés, et tous les réseaux. Le bon plan pour développer une audience.",
      accent: "cyan",
      tint: "rgba(34,211,238,0.16)",
      ring: "rgba(34,211,238,0.32)",
      iconColor: "#67E8F9",
      featured: true,
      features: [
        "15 comptes sociaux",
        "Publications illimitées",
        "Assistant IA inclus",
        "Analytics avancés + exports",
      ],
      detailed: [
        { category: "Publication", items: ["15 comptes sociaux connectés", "Publications illimitées", "Programmation 60 jours", "File d'attente intelligente"] },
        { category: "IA", items: ["Génération de légendes (illimité)", "Suggestions de hashtags", "Analyse de ton", "Idées de contenu"] },
        { category: "Analytics", items: ["Dashboard avancé", "Comparaison plateformes", "Top performers identifiés", "Exports PDF illimités"] },
        { category: "Support", items: ["Email prioritaire (24h)", "Chat support", "Onboarding personnalisé"] },
      ],
    },
    {
      id: "plan-agency",
      name: "Agency",
      price: "49€",
      period: "/ mois",
      tagline: "Pour les agences et équipes",
      desc: "Multi-clients, équipe, API, white-label. Tout pour scaler votre activité sociale.",
      accent: "magenta",
      tint: "rgba(244,114,182,0.14)",
      ring: "rgba(244,114,182,0.30)",
      iconColor: "#F9A8D4",
      features: [
        "Comptes sociaux illimités",
        "Multi-clients & équipe",
        "API + intégrations",
        "Rapports PDF white-label",
      ],
      detailed: [
        { category: "Espaces", items: ["Clients illimités", "Espaces isolés avec branding propre", "Switching rapide entre clients"] },
        { category: "Équipe", items: ["Membres illimités", "Rôles granulaires (admin, éditeur, viewer)", "Workflow d'approbation"] },
        { category: "Tech", items: ["Accès API complet", "Webhooks", "SSO (sur demande)", "Quotas configurables"] },
        { category: "Branding", items: ["Rapports PDF white-label", "Logo personnalisé", "Sous-domaine custom"] },
      ],
    },
  ];

  return (
    <section id="pricing" style={{ padding: "120px 0", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center" }}>
          <SectionLabel>Tarifs</SectionLabel>
          <SectionTitle>Un plan pour chaque <NeonText variant="indigo">ambition</NeonText></SectionTitle>
          <SectionSub>Tarifs transparents, sans engagement. Annulable à tout moment. Cliquez pour voir le détail de chaque plan.</SectionSub>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 24,
            marginTop: 60,
            alignItems: "stretch",
          }}
        >
          {plans.map((p) => (
            <motion.div
              key={p.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
              style={{ display: "flex" }}
            >
              <FocusableCard
                id={p.id}
                accent={p.accent}
                expandedContent={<PlanExpanded p={p} />}
                style={{ flex: 1 }}
              >
                {() => <PlanCardInner p={p} />}
              </FocusableCard>
            </motion.div>
          ))}
        </motion.div>

        <p style={{
          marginTop: 36, textAlign: "center",
          color: "var(--text-3)", fontSize: "0.88rem",
        }}>
          Un doute ? <Link href="/pricing" style={{ color: "var(--brand-300)", textDecoration: "underline", textUnderlineOffset: 4 }}>Comparez tous les plans en détail</Link>.
        </p>
      </div>
    </section>
  );
}

function PlanCardInner({ p }: { p: Plan }) {
  return (
    <div
      className="glass-card glass-card-neon"
      style={{
        padding: "32px 28px",
        height: "100%",
        position: "relative",
        ...(p.featured ? {
          borderColor: p.ring,
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.08) inset, " +
            "0 24px 48px -16px rgba(0,0,0,0.55), " +
            `0 0 0 1px ${p.ring}, ` +
            `0 0 64px -8px ${p.ring}`,
        } : {}),
      }}
    >
      {p.featured && (
        <div style={{
          position: "absolute",
          top: -10,
          right: 18,
          padding: "4px 12px",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          background: "linear-gradient(135deg, #67E8F9 0%, #818CF8 100%)",
          color: "#06070B",
          borderRadius: 99,
          boxShadow: "0 8px 24px -8px rgba(34,211,238,0.6)",
        }}>
          Le plus populaire
        </div>
      )}
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: p.iconColor,
          letterSpacing: "-0.005em",
          marginBottom: 8,
        }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
          <span style={{
            fontSize: "2.4rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text-1)",
            lineHeight: 1,
          }}>{p.price}</span>
          <span style={{ color: "var(--text-3)", fontSize: "0.88rem" }}>{p.period}</span>
        </div>
        <p style={{
          fontSize: "0.88rem",
          color: "var(--text-3)",
          lineHeight: 1.55,
          minHeight: 44,
        }}>{p.tagline}</p>
      </div>

      <div className="neon-divider" style={{ marginBottom: 18, opacity: 0.5 }} />

      <ul style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
        {p.features.map((feat) => (
          <li key={feat} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{
              width: 18, height: 18, flexShrink: 0, marginTop: 1,
              borderRadius: 6,
              background: p.tint,
              border: `1px solid ${p.ring}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={10} strokeWidth={2.5} color={p.iconColor} />
            </div>
            <span style={{ color: "var(--text-2)", fontSize: "0.88rem", lineHeight: 1.5 }}>{feat}</span>
          </li>
        ))}
      </ul>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: "0.78rem", fontWeight: 600,
        color: p.iconColor,
      }}>
        Détails complets <ArrowUpRight size={13} strokeWidth={2.2} />
      </div>
    </div>
  );
}

function PlanExpanded({ p }: { p: Plan }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{
          padding: "10px 16px",
          borderRadius: 14,
          background: p.tint,
          border: `1px solid ${p.ring}`,
          fontWeight: 700,
          color: p.iconColor,
          fontSize: "1.05rem",
          letterSpacing: "-0.015em",
          boxShadow: `0 0 40px -8px ${p.ring}`,
        }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{
            fontSize: "2.2rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text-1)",
            lineHeight: 1,
          }}>{p.price}</span>
          <span style={{ color: "var(--text-3)", fontSize: "0.92rem" }}>{p.period}</span>
        </div>
      </div>

      <p style={{
        fontSize: "1.02rem",
        color: "var(--text-2)",
        lineHeight: 1.55,
        marginBottom: 26,
      }}>{p.desc}</p>

      <div className="neon-divider" style={{ marginBottom: 22 }} />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 22,
        marginBottom: 30,
      }}>
        {p.detailed.map((cat) => (
          <div key={cat.category}>
            <div style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: p.iconColor,
              marginBottom: 12,
            }}>{cat.category}</div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cat.items.map((item) => (
                <li key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 16, height: 16, flexShrink: 0, marginTop: 1,
                    borderRadius: 5,
                    background: p.tint,
                    border: `1px solid ${p.ring}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={9} strokeWidth={2.5} color={p.iconColor} />
                  </div>
                  <span style={{ color: "var(--text-2)", fontSize: "0.88rem", lineHeight: 1.55 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/signup" className="glow-btn" style={{
          padding: "12px 26px",
          borderRadius: 12,
          fontWeight: 600,
          fontSize: "0.92rem",
          background: p.id === "plan-free"
            ? "rgba(255,255,255,0.06)"
            : "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
          color: "#fff",
          border: p.id === "plan-free" ? "1px solid var(--line-3)" : "none",
          boxShadow: p.id === "plan-free" ? "none" : "0 0 0 1px rgba(99,102,241,0.4), 0 12px 32px -8px rgba(79,70,229,0.55)",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          {p.id === "plan-free" ? "Commencer gratuitement" : "Choisir " + p.name} <ArrowUpRight size={15} strokeWidth={2.2} />
        </Link>
        {p.id !== "plan-free" && (
          <Link href="/contact" style={{
            padding: "12px 22px",
            borderRadius: 12,
            fontWeight: 500,
            fontSize: "0.92rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--line-3)",
            color: "var(--text-1)",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            Parler à l&apos;équipe
          </Link>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOW IT WORKS — connected steps with glow
═══════════════════════════════════════════════════════════ */
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineH = useTransform(scrollYProgress, [0.1, 0.7], ["0%", "100%"]);

  const steps = [
    { num: "1", title: "Connectez vos comptes",     desc: "Reliez Instagram, Facebook, LinkedIn, X, TikTok et plus en quelques clics. Notre système OAuth sécurisé protège vos données." },
    { num: "2", title: "Créez vos posts",            desc: "Rédigez, personnalisez et prévisualisez vos publications pour chaque plateforme dans notre éditeur riche et intuitif." },
    { num: "3", title: "Analysez vos performances", desc: "Consultez vos métriques unifiées, identifiez ce qui fonctionne et itérez rapidement pour une croissance constante." },
  ];

  return (
    <section ref={ref} style={{ padding: "120px 0", background: "rgba(255,255,255,0.01)", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center" }}>
          <SectionLabel>Processus</SectionLabel>
          <SectionTitle>Comment ça <span className="grad-text">marche</span></SectionTitle>
          <SectionSub>Démarrez en quelques minutes et publiez sur tous vos réseaux depuis une interface unique.</SectionSub>
        </div>

        <div style={{ position: "relative", marginTop: 70 }}>
          {/* Vertical progress line on desktop */}


          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.18 } } }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 32 }}
          >
            {steps.map((s) => (
              <motion.div
                key={s.num}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
                style={{ textAlign: "center", padding: "10px 24px", position: "relative" }}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #9B82FD, #5B3EE8 70%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", fontWeight: 800, margin: "0 auto 28px",
                  boxShadow: "0 0 40px rgba(124,92,252,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
                  position: "relative",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  {s.num}
                  <span aria-hidden="true" style={{
                    position: "absolute", inset: -4, borderRadius: "50%",
                    border: "1px solid rgba(124,92,252,0.3)",
                    animation: "ringPulse 2.6s ease-in-out infinite",
                  }} />
                </div>
                <h3 style={{ fontSize: "1.18rem", fontWeight: 700, marginBottom: 12 }}>{s.title}</h3>
                <p style={{ color: "var(--clr-muted)", fontSize: "0.92rem", lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPARAISON — lien vers page factuelle (pas de faux avis)
═══════════════════════════════════════════════════════════ */
function ComparisonTeaserSection() {
  return (
    <section style={{ padding: "120px 0", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center" }}>
          <SectionLabel>Transparence</SectionLabel>
          <SectionTitle>Postly <span className="grad-text">vs</span> les outils du marché</SectionTitle>
          <SectionSub>
            Tableau comparatif factuel (Buffer, Hootsuite, Later, Sprout Social) — sans témoignages inventés.
          </SectionSub>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}
        >
          {[
            "Comparaison des familles de fonctionnalités (planification, analytics, IA, public).",
            "Tarifs : vérifier les grilles officielles des concurrents avant toute décision.",
            "Postly cible les créateurs et PME francophones avec une interface unique et des tarifs lisibles.",
          ].map((text) => (
            <motion.div
              key={text}
              variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }}
            >
              <TiltCard
                intensity={5}
                style={{
                  background: "linear-gradient(180deg, rgba(17,17,24,0.7), rgba(13,13,20,0.85))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 22,
                  padding: 26,
                  height: "100%",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  color: "var(--clr-muted)",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                }}
              >
                {text}
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>

        <div style={{ textAlign: "center", marginTop: 44 }}>
          <MagneticLink
            href="/compare"
            strength={16}
            style={{
              display: "inline-flex",
              padding: "14px 28px",
              borderRadius: 22,
              fontWeight: 700,
              fontSize: "1rem",
              background: "linear-gradient(135deg,var(--clr-primary),#5B3EE8)",
              color: "#fff",
              boxShadow: "0 0 32px rgba(124,92,252,0.45)",
            }}
          >
            Voir le tableau comparatif →
          </MagneticLink>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   CTA
═══════════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <section style={{ padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{
            background: "linear-gradient(180deg, rgba(20,18,40,0.65), rgba(11,10,22,0.85))",
            border: "1px solid rgba(124,92,252,0.3)",
            borderRadius: 28, padding: "84px 40px",
            textAlign: "center", position: "relative", overflow: "hidden",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            boxShadow: "0 60px 120px -30px rgba(124,92,252,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div aria-hidden="true" style={{
            position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)",
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(124,92,252,0.22) 0%,transparent 70%)",
            filter: "blur(40px)",
          }} />
          <div aria-hidden="true" style={{
            position: "absolute", bottom: "-30%", right: "-10%",
            width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(34,211,160,0.16),transparent 70%)",
            filter: "blur(60px)",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <SectionLabel>Commencez maintenant</SectionLabel>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 20 }}>
              Prêt à <span className="grad-text">décupler</span> votre présence ?
            </h2>
            <p style={{ color: "var(--clr-muted)", fontSize: "1.1rem", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7 }}>
              Passez à l&apos;action : planifiez, publiez et analysez depuis un seul espace — avec ou sans abonnement payant.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <MagneticLink
                href="/signup"
                strength={20}
                style={{
                  padding: "14px 32px", borderRadius: 24, fontWeight: 700, fontSize: "1rem",
                  background: "linear-gradient(135deg,var(--clr-primary),#5B3EE8)", color: "#fff",
                  boxShadow: "0 0 40px rgba(124,92,252,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                Commencez gratuitement — 0€
              </MagneticLink>
              <MagneticLink
                href="/pricing"
                strength={14}
                style={{
                  padding: "14px 30px", borderRadius: 24, fontWeight: 600, fontSize: "1rem",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "var(--clr-text)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                Voir les tarifs
              </MagneticLink>
            </div>
            <p style={{ marginTop: 24, fontSize: "0.8rem", color: "var(--clr-muted)" }}>
              ✓ Aucune carte bancaire requise &nbsp;·&nbsp; ✓ Configuration en 2 minutes &nbsp;·&nbsp; ✓ Annulation à tout moment
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════ */
function FooterSection() {
  return (
    <footer style={{ borderTop: "1px solid var(--clr-border)", padding: "48px 0 32px", background: "rgba(5,5,9,0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap", marginBottom: 40 }}>
          <div style={{ maxWidth: 260 }}>
            <div style={{ marginBottom: 12 }}>
              <Logo size={28} href="/" />
            </div>
            <p style={{ color: "var(--clr-muted)", fontSize: "0.875rem", lineHeight: 1.7 }}>
              La plateforme tout-en-un pour planifier, publier et analyser votre présence sur les réseaux sociaux.
            </p>
          </div>

          {([
            { title: "Produit",    links: [["Tarifs", "/pricing"], ["Comparer", "/compare"], ["Connexion", "/login"], ["Inscription", "/signup"]] },
            { title: "Ressources", links: [["Contact", "/contact"], ["Support", "mailto:support@getpostly.space"]] },
            { title: "Entreprise", links: [["Confidentialité", "/privacy"], ["CGU", "/terms"]] },
          ] as const).map(({ title, links }) => (
            <div key={title}>
              <h4 style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--clr-muted)", marginBottom: 16 }}>{title}</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="footer-link" style={{ fontSize: "0.875rem", color: "var(--clr-muted)", transition: "color 0.2s" }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          borderTop: "1px solid var(--clr-border)", paddingTop: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          color: "var(--clr-muted)", fontSize: "0.8rem", flexWrap: "wrap", gap: 12,
        }}>
          <span>© 2026 Postly SAS. Tous droits réservés.</span>
          <span style={{ color: "var(--text-2)" }}>Fait à la main, en France.</span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "inline-block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: 2,
      textTransform: "uppercase", color: "var(--clr-primary-h)",
      padding: "5px 14px", borderRadius: 100,
      background: "rgba(124,92,252,0.12)",
      border: "1px solid rgba(124,92,252,0.25)",
      marginBottom: 20,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>{children}</div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 800, letterSpacing: "-1px",
      lineHeight: 1.15, marginBottom: 18,
    }}>{children}</h2>
  );
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "1.1rem", fontWeight: 400, color: "var(--clr-muted)",
      lineHeight: 1.7, maxWidth: 580, margin: "0 auto",
    }}>{children}</p>
  );
}

