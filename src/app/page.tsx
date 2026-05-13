"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import MagneticLink from "@/components/cinematic/MagneticLink";
import TiltCard from "@/components/cinematic/TiltCard";
import LiveDashboard from "@/components/cinematic/LiveDashboard";
import Marquee from "@/components/cinematic/Marquee";
import BootSplash from "@/components/cinematic/BootSplash";
import LenisProvider from "@/components/cinematic/LenisProvider";
import CustomCursor from "@/components/cinematic/CustomCursor";
import LandingChatWidget from "@/components/landing/LandingChatWidget";

const CityScene = dynamic(() => import("@/components/cinematic/CityScene"), {
  ssr: false,
  loading: () => null,
});

const WindowFrame = dynamic(() => import("@/components/cinematic/WindowFrame"), {
  ssr: false,
  loading: () => null,
});

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

      {/* Cinematic 3D city behind everything */}
      <CityScene />

      {/* Glass / rain overlay above scene */}
      <WindowFrame />

      {/* Foreground gradient overlay to keep content readable over the scene */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
        background:
          "radial-gradient(circle at 50% 20%, rgba(124,92,252,0.10), transparent 55%), linear-gradient(180deg, rgba(5,5,9,0.35) 0%, rgba(5,5,9,0.55) 55%, rgba(5,5,9,0.92) 100%)",
      }} />

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
  const yTitle = useSpring(useTransform(scrollYProgress, [0, 1], [0, -120]), { stiffness: 80, damping: 22 });
  const yDash = useSpring(useTransform(scrollYProgress, [0, 1], [0, -40]), { stiffness: 80, damping: 22 });
  const opacityHero = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const blurHero = useTransform(scrollYProgress, [0, 0.6], [0, 6]);
  const filter = useTransform(blurHero, (b) => `blur(${b}px)`);

  return (
    <section ref={ref} style={{
      position: "relative", overflow: "hidden",
      padding: "160px 0 100px",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", textAlign: "center",
      minHeight: "92vh",
    }}>
      <motion.div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "0 24px", width: "100%", y: yTitle, opacity: opacityHero, filter, willChange: "transform" }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 100,
            background: "rgba(124,92,252,0.12)",
            border: "1px solid rgba(124,92,252,0.3)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            fontSize: "0.8rem", fontWeight: 600, color: "var(--clr-primary-h)",
            marginBottom: 32,
            boxShadow: "0 0 30px rgba(124,92,252,0.15)",
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--clr-green)",
            animation: "pulse 2s ease-in-out infinite",
            display: "inline-block",
            boxShadow: "0 0 8px var(--clr-green)",
          }} />
          Nouveau — Analyse IA v2.0 disponible
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          style={{
            fontSize: "clamp(3rem,7vw,6rem)",
            fontWeight: 800,
            letterSpacing: "-3px",
            lineHeight: 1.05,
            marginBottom: 24,
          }}
        >
          Publiez <span className="grad-text">partout.</span><br />
          Grandissez <span className="grad-text">partout.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          style={{
            fontSize: "clamp(1rem,2vw,1.25rem)",
            color: "var(--clr-muted)",
            maxWidth: 580, margin: "0 auto 44px",
            lineHeight: 1.7,
          }}
        >
          Postly centralise tous vos réseaux sociaux. Planifiez, publiez et analysez
          vos performances depuis un seul tableau de bord alimenté par l&apos;IA.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 96 }}
        >
          <MagneticLink
            href="/signup"
            strength={20}
            style={{
              padding: "14px 32px", borderRadius: 24,
              fontSize: "1rem", fontWeight: 700, color: "#fff",
              background: "linear-gradient(135deg,var(--clr-primary),#5B3EE8)",
              boxShadow: "0 0 40px rgba(124,92,252,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            ✦ Commencez gratuitement
          </MagneticLink>
          <MagneticLink
            href="#demo"
            strength={14}
            style={{
              padding: "14px 30px", borderRadius: 24,
              fontSize: "1rem", fontWeight: 600, color: "var(--clr-text)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            Voir la démo →
          </MagneticLink>
        </motion.div>

        {/* Live dashboard */}
        <motion.div id="demo" style={{ y: yDash, willChange: "transform" }}>
          <LiveDashboard />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FEATURES — TiltCard glass
═══════════════════════════════════════════════════════════ */
function FeaturesSection() {
  const features = [
    {
      icon: "🗓️", glow: "rgba(124,92,252,0.45)",
      title: "Programmation Intelligente",
      desc: "Planifiez vos publications à l'avance sur tous vos réseaux. Notre IA identifie les meilleurs moments pour maximiser votre visibilité et votre engagement.",
    },
    {
      icon: "🤖", glow: "rgba(34,211,160,0.45)",
      title: "Assistance IA",
      desc: "Générez des légendes percutantes, obtenez des suggestions de hashtags et analysez le ton de vos publications grâce à un assistant IA intégré.",
    },
    {
      icon: "📊", glow: "rgba(252,92,124,0.45)",
      title: "Analytics Détaillés",
      desc: "Suivez vos KPIs en temps réel, identifiez vos meilleurs contenus et prenez des décisions éclairées grâce à des rapports visuels et exportables.",
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
          {features.map((f) => (
            <motion.article
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
            >
              <TiltCard
                intensity={6}
                style={{
                  background: "linear-gradient(180deg, rgba(17,17,24,0.7), rgba(13,13,20,0.85))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 24,
                  padding: "36px 30px",
                  height: "100%",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", marginBottom: 24,
                  background: `radial-gradient(circle, ${f.glow}, transparent 70%)`,
                  boxShadow: `0 0 28px ${f.glow}`,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 12 }}>{f.title}</h3>
                <p style={{ color: "var(--clr-muted)", fontSize: "0.95rem", lineHeight: 1.7 }}>{f.desc}</p>
              </TiltCard>
            </motion.article>
          ))}
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
          <span style={{ color: "var(--clr-primary-h)" }}>✦ Fait avec passion en France</span>
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

