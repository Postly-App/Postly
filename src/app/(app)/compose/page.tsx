"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Upload from "@/components/upload";
import SocialIcon from "@/components/SocialIcon";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "INSTAGRAM", label: "Instagram", color: "#E1306C", maxChars: 2200 },
  { id: "TWITTER",   label: "Twitter/X", color: "#1DA1F2", maxChars: 280 },
  { id: "LINKEDIN",  label: "LinkedIn",  color: "#0A66C2", maxChars: 3000 },
  { id: "TIKTOK",    label: "TikTok",    color: "#010101", maxChars: 2200 },
  { id: "YOUTUBE",   label: "YouTube",   color: "#FF0000", maxChars: 5000 },
  { id: "FACEBOOK",  label: "Facebook",  color: "#1877F2", maxChars: 63206 },
  { id: "THREADS",   label: "Threads",   color: "#000",    maxChars: 500 },
] as const;

const HASHTAGS = ["#marketing", "#socialmedia", "#contentcreator", "#digitalmarketing", "#stratégie", "#croissance", "#entrepreneur", "#réseauxsociaux"];

const AI_CHIPS = ["Rendre plus engageant", "Ajouter un CTA", "Version courte", "Adapter à TikTok", "Ajouter des emojis"];

const AI_SUGGESTIONS = [
  "🚀 On a quelque chose de grand à vous partager aujourd'hui — on travaille dessus depuis des mois et c'est enfin là !",
  "💡 3 choses que personne ne dit sur la croissance de 0 à 10K abonnés :\n\n1. La régularité bat la viralité\n2. L'engagement > la portée\n3. Cible d'abord une niche, puis élargis",
  "✨ Dans les coulisses de notre workflow 2026. Spoiler : l'IA nous a économisé 6h par semaine.",
  "📊 Ce graphique a changé notre façon de voir le contenu. Ton meilleur post n'est pas forcément le plus aimé.",
];

type PublishMode = "now" | "scheduled" | "draft";
type PlatformId = (typeof PLATFORMS)[number]["id"];

export default function ComposePage() {
  const router = useRouter();
  const [content, setContent]                   = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["INSTAGRAM", "LINKEDIN"]);
  const [publishMode, setPublishMode]           = useState<PublishMode>("scheduled");
  const [scheduledDate, setScheduledDate]       = useState("");
  const [scheduledTime, setScheduledTime]       = useState("18:00");
  const [mediaUrls, setMediaUrls]               = useState<string[]>([]);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const maxChars = PLATFORMS.find((p) => selectedPlatforms.includes(p.id))?.maxChars ?? 2200;
  const charPct  = Math.min((content.length / maxChars) * 100, 100);
  const charWarn = content.length > maxChars * 0.9;

  const handleSubmit = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;
    if (publishMode === "scheduled" && scheduledDate && new Date(`${scheduledDate}T${scheduledTime}`) <= new Date()) {
      toast.error("La date de planification doit être dans le futur");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        content,
        platforms: selectedPlatforms,
        mediaUrls,
        ...(publishMode === "scheduled" && scheduledDate
          ? { scheduledAt: new Date(`${scheduledDate}T${scheduledTime}`).toISOString() }
          : {}),
      };
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create post");
      const post = await res.json();
      if (publishMode === "now") {
        await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
        toast.info("Publication sur les réseaux sociaux bientôt disponible — ton post a été sauvegardé en brouillon");
      } else if (publishMode === "scheduled") {
        toast.success("Post planifié avec succès !");
      } else {
        toast.success("Brouillon sauvegardé !");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  /* ── styles ─────────────────────────────────────────── */
  const card: React.CSSProperties = {
    background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16,
  };
  const sectionLbl: React.CSSProperties = {
    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "1px",
    textTransform: "uppercase", color: "var(--clr-muted)", marginBottom: 12,
  };

  return (
    <div style={{ padding: "0 28px 32px" }}>

      {/* ── Page header ──────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "24px 4px 20px", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Nouveau post</h1>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.82rem", marginTop: 3 }}>Créez et planifiez votre publication</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { setPublishMode("draft"); handleSubmit(); }}
            style={{
              padding: "9px 18px", borderRadius: 12, border: "1px solid var(--clr-border)",
              background: "var(--clr-card2)", color: "var(--clr-muted)",
              fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)",
            }}
          >Sauvegarder</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim() || selectedPlatforms.length === 0}
            style={{
              padding: "9px 18px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
              color: "#fff", fontSize: "0.82rem", fontWeight: 700,
              cursor: (loading || !content.trim() || selectedPlatforms.length === 0) ? "not-allowed" : "pointer",
              opacity: (loading || !content.trim() || selectedPlatforms.length === 0) ? 0.5 : 1,
              fontFamily: "var(--font)", boxShadow: "0 0 16px rgba(124,92,252,0.35)",
              transition: "var(--transition)",
            }}
          >
            {loading ? "En cours…" : publishMode === "now" ? "⚡ Publier →" : publishMode === "scheduled" ? "📅 Planifier →" : "📝 Brouillon →"}
          </button>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

        {/* ── LEFT: editor ─────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Platform selector */}
          <div style={{ ...card, padding: 20 }}>
            <div style={sectionLbl}>Plateformes</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PLATFORMS.map((p) => {
                const sel = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    aria-pressed={sel}
                    style={{
                      padding: "8px 16px", borderRadius: 10, fontFamily: "var(--font)",
                      fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                      border: sel ? `1px solid ${p.color}60` : "1px solid var(--clr-border)",
                      background: sel ? `${p.color}18` : "transparent",
                      color: sel ? p.color : "var(--clr-muted)",
                      transition: "var(--transition)",
                    }}
                  ><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><SocialIcon platform={p.id} size={14} /> {p.label}</span></button>
                );
              })}
            </div>
          </div>

          {/* Text editor */}
          <div style={{ ...card, padding: 20 }}>
            <label htmlFor="editor-text" style={sectionLbl}>Contenu</label>
            <textarea
              id="editor-text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={maxChars > 63000 ? undefined : maxChars}
              placeholder="Rédigez votre publication ici... L'IA peut vous aider à l'améliorer ✦"
              rows={8}
              style={{
                width: "100%", background: "transparent", border: "none",
                outline: "none", resize: "none", fontSize: "0.9rem",
                lineHeight: 1.7, color: "var(--clr-text)", fontFamily: "var(--font)",
                boxSizing: "border-box",
              }}
            />
            {/* Editor toolbar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              paddingTop: 14, borderTop: "1px solid var(--clr-border)", marginTop: 4, flexWrap: "wrap",
            }}>
              <Upload onUploaded={(urls) => setMediaUrls((prev) => [...prev, ...urls])} />
              {[["🏷️", "Hashtags"], ["😊", "Emoji"], ["🔗", "Lien"]].map(([icon, label]) => (
                <button key={label} style={{
                  padding: "6px 12px", borderRadius: 8, border: "1px solid var(--clr-border)",
                  background: "var(--clr-card2)", color: "var(--clr-muted)",
                  fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)",
                }}>{icon} {label}</button>
              ))}
              {mediaUrls.length > 0 && (
                <span style={{ fontSize: "0.72rem", color: "#22D3A0", fontWeight: 700, marginLeft: 4 }}>
                  {mediaUrls.length} fichier{mediaUrls.length > 1 ? "s" : ""} uploadé{mediaUrls.length > 1 ? "s" : ""}
                </span>
              )}
              <span
                aria-live="polite"
                style={{
                  marginLeft: "auto", fontSize: "0.78rem", fontWeight: 700,
                  color: charWarn ? "var(--clr-danger)" : "var(--clr-muted)",
                }}
              >
                {content.length.toLocaleString("fr-FR")} / {maxChars.toLocaleString("fr-FR")}
              </span>
            </div>
            {/* Char progress */}
            <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 8 }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 0.2s",
                width: `${charPct}%`,
                background: charWarn ? "var(--clr-danger)" : "linear-gradient(90deg,#7C5CFC,#22D3A0)",
              }} />
            </div>
          </div>

          {/* Schedule */}
          <div style={{ ...card, padding: 20 }}>
            <div style={sectionLbl}>⏱️ Planification</div>
            {/* Mode buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["scheduled", "now", "draft"] as PublishMode[]).map((mode) => (
                <button key={mode} onClick={() => setPublishMode(mode)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 10, fontFamily: "var(--font)",
                    fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                    border: publishMode === mode ? "1px solid rgba(124,92,252,0.4)" : "1px solid var(--clr-border)",
                    background: publishMode === mode ? "rgba(124,92,252,0.15)" : "transparent",
                    color: publishMode === mode ? "var(--clr-primary-h)" : "var(--clr-muted)",
                    transition: "var(--transition)",
                  }}
                >
                  {mode === "scheduled" ? "📅 Planifier" : mode === "now" ? "⚡ Maintenant" : "📝 Brouillon"}
                </button>
              ))}
            </div>
            {publishMode === "scheduled" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ ...sectionLbl, marginBottom: 6 }}>Date</label>
                  <input
                    type="date" value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ ...sectionLbl, marginBottom: 6 }}>Heure</label>
                  <input
                    type="time" value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
            {/* Best time hint */}
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--clr-muted)" }}>💡 Meilleure heure détectée :</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#22D3A0" }}>Vendredi 18:00</span>
              <button
                onClick={() => { setScheduledTime("18:00"); }}
                style={{
                  padding: "4px 12px", borderRadius: 8, border: "1px solid rgba(34,211,160,0.3)",
                  background: "rgba(34,211,160,0.06)", color: "#22D3A0",
                  fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)",
                }}
              >Appliquer</button>
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(252,92,124,0.1)", border: "1px solid rgba(252,92,124,0.3)", color: "var(--clr-danger)", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}
        </div>

        {/* ── RIGHT: AI sidebar ─────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* AI suggestions */}
          <div style={{ ...card, padding: 20, borderColor: "rgba(124,92,252,0.2)", background: "linear-gradient(160deg,rgba(124,92,252,0.06),var(--clr-card))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: "1rem" }}>🤖</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "var(--clr-primary-h)" }}>
                Suggestions IA
              </span>
            </div>

            {/* Tone indicator */}
            <div style={{
              background: "var(--clr-card2)", border: "1px solid rgba(124,92,252,0.2)",
              borderRadius: 10, padding: 12, marginBottom: 14,
            }}>
              <div style={{ fontSize: "0.75rem", color: "var(--clr-muted)", marginBottom: 8 }}>
                Ton détecté : <strong style={{ color: "var(--clr-primary-h)" }}>Professionnel</strong>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 4 }}>
                <div style={{ width: "80%", height: "100%", background: "linear-gradient(90deg,var(--clr-primary),#22D3A0)", borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--clr-muted)" }}>
                Score d&apos;engagement estimé : <strong style={{ color: "#22D3A0" }}>Élevé</strong>
              </div>
            </div>

            {/* Action chips */}
            {AI_CHIPS.map((chip) => (
              <button key={chip} style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "9px 14px", borderRadius: 10, marginBottom: 8,
                border: "1px solid var(--clr-border)", background: "var(--clr-card2)",
                color: "var(--clr-muted)", fontSize: "0.78rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "var(--font)", transition: "var(--transition)",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,92,252,0.35)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--clr-primary-h)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--clr-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--clr-muted)"; }}
              >{chip}</button>
            ))}

            {/* Suggestion cards */}
            <div style={{ marginTop: 4, fontSize: "0.72rem", color: "var(--clr-muted)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Exemples de posts
            </div>
            {AI_SUGGESTIONS.slice(0, 2).map((s, i) => (
              <button key={i} onClick={() => setContent(s)} style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 12px", borderRadius: 10, marginBottom: 6,
                border: "1px solid var(--clr-border)", background: "var(--clr-card2)",
                color: "var(--clr-muted)", fontSize: "0.72rem", fontWeight: 500,
                cursor: "pointer", fontFamily: "var(--font)", lineHeight: 1.5,
                transition: "var(--transition)",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,92,252,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--clr-text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--clr-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--clr-muted)"; }}
              >
                {s.substring(0, 80)}…
              </button>
            ))}
          </div>

          {/* Hashtags */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ ...sectionLbl, display: "flex", alignItems: "center", gap: 6 }}>
              🏷️ Hashtags suggérés
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {HASHTAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setContent((prev) => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + tag)}
                  style={{
                    padding: "5px 12px", borderRadius: 100,
                    background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.2)",
                    color: "var(--clr-primary-h)", fontSize: "0.75rem", fontWeight: 600,
                    cursor: "pointer", fontFamily: "var(--font)", transition: "var(--transition)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,92,252,0.2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,92,252,0.1)"; }}
                >{tag}</button>
              ))}
            </div>
          </div>

          {/* Optimization badge */}
          <div style={{
            padding: 16, borderRadius: 12,
            background: "rgba(34,211,160,0.06)", border: "1px solid rgba(34,211,160,0.2)",
          }}>
            <div style={{ fontSize: "0.82rem", color: "#22D3A0", fontWeight: 700, marginBottom: 4 }}>
              ✓ Optimisé pour Instagram
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--clr-muted)" }}>
              Longueur idéale · Hashtags pertinents · Heure optimale
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
