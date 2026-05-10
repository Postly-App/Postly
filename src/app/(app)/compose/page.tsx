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

const HASHTAGS = [
  "#marketing", "#socialmedia", "#contentcreator", "#digitalmarketing",
  "#stratégie", "#croissance", "#entrepreneur", "#réseauxsociaux",
];

const AI_SUGGESTIONS = [
  "🚀 On a quelque chose de grand à vous partager aujourd'hui — on travaille dessus depuis des mois et c'est enfin là !",
  "💡 3 choses que personne ne dit sur la croissance de 0 à 10K abonnés :\n\n1. La régularité bat la viralité\n2. L'engagement > la portée\n3. Cible d'abord une niche, puis élargis",
  "✨ Dans les coulisses de notre workflow 2026. Spoiler : l'IA nous a économisé 6h par semaine.",
];

type PublishMode = "now" | "scheduled" | "draft";

export default function ComposePage() {
  const router = useRouter();
  const [content, setContent]                     = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["INSTAGRAM", "LINKEDIN"]);
  const [publishMode, setPublishMode]             = useState<PublishMode>("scheduled");
  const [scheduledDate, setScheduledDate]         = useState("");
  const [scheduledTime, setScheduledTime]         = useState("18:00");
  const [mediaUrls, setMediaUrls]                 = useState<string[]>([]);
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState<string | null>(null);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const maxChars = selectedPlatforms.length === 0
    ? 2200
    : Math.min(...PLATFORMS.filter((p) => selectedPlatforms.includes(p.id)).map((p) => p.maxChars));
  const charPct  = Math.min((content.length / maxChars) * 100, 100);
  const charWarn = content.length > maxChars * 0.9;

  const todayStr = new Date().toISOString().slice(0, 10);

  const submitWith = async (mode: PublishMode) => {
    if (!content.trim() || selectedPlatforms.length === 0) {
      toast.error("Ajoute du texte et au moins une plateforme.");
      return;
    }
    if (mode === "scheduled") {
      if (!scheduledDate) {
        toast.error("Choisis une date pour planifier.");
        return;
      }
      if (new Date(`${scheduledDate}T${scheduledTime}`) <= new Date()) {
        toast.error("La date de planification doit être dans le futur.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        content,
        platforms: selectedPlatforms,
        mediaUrls,
        ...(mode === "scheduled"
          ? { scheduledAt: new Date(`${scheduledDate}T${scheduledTime}`).toISOString() }
          : {}),
      };
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Erreur lors de la création du post");
      }
      const post = await res.json();
      if (mode === "now") {
        await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
        toast.info(
          "Publication directe sur les réseaux sociaux pas encore branchée — le post est sauvegardé en brouillon."
        );
      } else if (mode === "scheduled") {
        toast.success("Post planifié avec succès !");
      } else {
        toast.success("Brouillon sauvegardé !");
      }
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrimary = () => submitWith(publishMode);
  const handleSaveDraft = () => submitWith("draft");

  const insertHashtag = (tag: string) => {
    setContent((prev) => prev + (prev.length === 0 || prev.endsWith(" ") ? "" : " ") + tag);
  };

  const card: React.CSSProperties = {
    background: "var(--clr-card)", border: "1px solid var(--clr-border)", borderRadius: 16,
  };
  const sectionLbl: React.CSSProperties = {
    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "1px",
    textTransform: "uppercase", color: "var(--clr-muted)", marginBottom: 12,
  };

  return (
    <div style={{ padding: "0 28px 32px" }}>
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
            onClick={handleSaveDraft}
            disabled={loading || !content.trim() || selectedPlatforms.length === 0}
            style={{
              padding: "9px 18px", borderRadius: 12, border: "1px solid var(--clr-border)",
              background: "var(--clr-card2)", color: "var(--clr-muted)",
              fontSize: "0.82rem", fontWeight: 600,
              cursor: (loading || !content.trim() || selectedPlatforms.length === 0) ? "not-allowed" : "pointer",
              opacity: (loading || !content.trim() || selectedPlatforms.length === 0) ? 0.5 : 1,
              fontFamily: "var(--font)",
            }}
          >Sauvegarder</button>
          <button
            onClick={handlePrimary}
            disabled={loading || !content.trim() || selectedPlatforms.length === 0}
            style={{
              padding: "9px 18px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg,#7C5CFC,#5B3EE8)",
              color: "#fff", fontSize: "0.82rem", fontWeight: 700,
              cursor: (loading || !content.trim() || selectedPlatforms.length === 0) ? "not-allowed" : "pointer",
              opacity: (loading || !content.trim() || selectedPlatforms.length === 0) ? 0.5 : 1,
              fontFamily: "var(--font)", boxShadow: "0 0 16px rgba(124,92,252,0.35)",
            }}
          >
            {loading ? "En cours…" : publishMode === "now" ? "⚡ Publier" : publishMode === "scheduled" ? "📅 Planifier" : "📝 Brouillon"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                    }}
                  ><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><SocialIcon platform={p.id} size={14} /> {p.label}</span></button>
                );
              })}
            </div>
          </div>

          <div style={{ ...card, padding: 20 }}>
            <label htmlFor="editor-text" style={sectionLbl}>Contenu</label>
            <textarea
              id="editor-text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={maxChars > 63000 ? undefined : maxChars}
              placeholder="Rédigez votre publication ici…"
              rows={8}
              style={{
                width: "100%", background: "transparent", border: "none",
                outline: "none", resize: "none", fontSize: "0.9rem",
                lineHeight: 1.7, color: "var(--clr-text)", fontFamily: "var(--font)",
                boxSizing: "border-box",
              }}
            />
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              paddingTop: 14, borderTop: "1px solid var(--clr-border)", marginTop: 4, flexWrap: "wrap",
            }}>
              <Upload onUploaded={(urls) => setMediaUrls((prev) => [...prev, ...urls])} />
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
            <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 8 }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 0.2s",
                width: `${charPct}%`,
                background: charWarn ? "var(--clr-danger)" : "linear-gradient(90deg,#7C5CFC,#22D3A0)",
              }} />
            </div>
          </div>

          <div style={{ ...card, padding: 20 }}>
            <div style={sectionLbl}>⏱️ Planification</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["scheduled", "now", "draft"] as PublishMode[]).map((mode) => (
                <button key={mode} onClick={() => setPublishMode(mode)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 10, fontFamily: "var(--font)",
                    fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                    border: publishMode === mode ? "1px solid rgba(124,92,252,0.4)" : "1px solid var(--clr-border)",
                    background: publishMode === mode ? "rgba(124,92,252,0.15)" : "transparent",
                    color: publishMode === mode ? "var(--clr-primary-h)" : "var(--clr-muted)",
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
                    min={todayStr}
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
          </div>

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(252,92,124,0.1)", border: "1px solid rgba(252,92,124,0.3)", color: "var(--clr-danger)", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...card, padding: 20 }}>
            <div style={{ ...sectionLbl, display: "flex", alignItems: "center", gap: 6 }}>
              ✨ Exemples de posts
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--clr-muted)", marginBottom: 12, lineHeight: 1.5 }}>
              Cliquez pour insérer un modèle dans l&apos;éditeur.
            </p>
            {AI_SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => setContent(s)} style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 12px", borderRadius: 10, marginBottom: 6,
                border: "1px solid var(--clr-border)", background: "var(--clr-card2)",
                color: "var(--clr-muted)", fontSize: "0.72rem", fontWeight: 500,
                cursor: "pointer", fontFamily: "var(--font)", lineHeight: 1.5,
              }}>
                {s.length > 90 ? `${s.substring(0, 90)}…` : s}
              </button>
            ))}
          </div>

          <div style={{ ...card, padding: 20 }}>
            <div style={{ ...sectionLbl, display: "flex", alignItems: "center", gap: 6 }}>
              🏷️ Hashtags suggérés
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {HASHTAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => insertHashtag(tag)}
                  style={{
                    padding: "5px 12px", borderRadius: 100,
                    background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.2)",
                    color: "var(--clr-primary-h)", fontSize: "0.75rem", fontWeight: 600,
                    cursor: "pointer", fontFamily: "var(--font)",
                  }}
                >{tag}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
