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
import AerialCityCanvas from "@/components/landing/AerialCityCanvas";
import HeroPhoneMockup from "@/components/landing/HeroPhoneMockup";
import HeroStatsBar from "@/components/landing/HeroStatsBar";
import { ArrowUpRight, Play, CalendarClock, Sparkles, LineChart } from "lucide-react";

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

      {/* Vue aérienne top-down — canvas procédural, fixed sur toute la landing */}
      <AerialCityCanvas />

      <div id="scroll-progress" aria-hidden="true" />

      <div style={{ position: "relative", zIndex: 3 }}>
        <TopNav />
        <HeroSection />
        <Marquee />
        <FeaturesSection />
        <HowItWorks />
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
              La plateforme n°1 pour vos réseaux sociaux
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease: EASE }}
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
              <span
                style={{
                  background: "linear-gradient(135deg, #818CF8 0%, #C084FC 60%, #F472B6 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  display: "inline-block",
                }}
              >
                Développez.
              </span>
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
              Gérez tous vos réseaux sociaux depuis une seule plateforme.
              Gagnez du temps, créez du contenu incroyable et développez
              votre audience comme jamais.
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
                href="#demo"
                strength={10}
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
   FEATURES — TiltCard glass
═══════════════════════════════════════════════════════════ */
function FeaturesSection() {
  const features = [
    {
      Icon: CalendarClock,
      tint: "rgba(99,102,241,0.18)",
      ring: "rgba(99,102,241,0.32)",
      title: "Planification intelligente",
      desc: "Programme tes publications à l'avance sur tous tes réseaux. L'IA identifie les meilleurs moments pour maximiser ta portée.",
    },
    {
      Icon: Sparkles,
      tint: "rgba(6,182,212,0.16)",
      ring: "rgba(6,182,212,0.30)",
      title: "Assistant IA intégré",
      desc: "Génère des légendes percutantes, suggestions de hashtags et analyse de ton — tout depuis ton cockpit, sans changer d'outil.",
    },
    {
      Icon: LineChart,
      tint: "rgba(52,211,153,0.16)",
      ring: "rgba(52,211,153,0.30)",
      title: "Analytics détaillés",
      desc: "Suivis temps réel, identification des meilleurs contenus et rapports visuels exportables. Prends des décisions basées sur la donnée.",
    },
  ];

  return (
    <section id="features" style={{ padding: "120px 0", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center" }}>
          <SectionLabel>Fonctionnalités</SectionLabel>
          <SectionTitle>Tout ce dont vous avez <span className="grad-text">besoin</span></SectionTitle>
          <SectionSub>Des outils puissants conçus pour les créateurs modernes et les équipes marketing ambitieuses.</SectionSub>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: 24, marginTop: 60, perspective: 1400,
          }}
        >
          {features.map((f) => {
            const Icon = f.Icon;
            return (
              <motion.article
                key={f.title}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
              >
                <TiltCard
                  intensity={4}
                  style={{
                    background: "linear-gradient(180deg, rgba(14,16,24,0.78), rgba(11,13,20,0.92))",
                    border: "1px solid var(--line-2)",
                    borderRadius: 20,
                    padding: "32px 28px",
                    height: "100%",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow:
                      "0 1px 0 0 rgba(255,255,255,0.05) inset, " +
                      "0 24px 48px -16px rgba(0,0,0,0.55), " +
                      "0 8px 16px -8px rgba(0,0,0,0.4)",
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 22,
                    background: f.tint,
                    border: `1px solid ${f.ring}`,
                    boxShadow: "0 1px 0 0 rgba(255,255,255,0.06) inset",
                  }}>
                    <Icon size={20} strokeWidth={1.5} color="var(--text-1)" />
                  </div>
                  <h3 style={{
                    fontSize: "1.06rem",
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
                  }}>{f.desc}</p>
                </TiltCard>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
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
            { title: "Ressources", links: [["Contact", "/contact"], ["Support", "mailto:postlyservice@gmail.com"]] },
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

