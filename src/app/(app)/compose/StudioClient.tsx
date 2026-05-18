"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Upload from "@/components/upload";
import SocialIcon from "@/components/SocialIcon";
import {
  Sparkles,
  Scissors,
  Zap,
  Briefcase,
  Megaphone,
  Hash,
  Send,
  Calendar,
  Save,
  Image as ImageIcon,
  X,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Plateformes : seules celles RÉELLEMENT publiables côté backend
   apparaissent. Charactères max = limite plateforme (utilisée
   pour le compteur + AI context). Couleurs pour le preview.
──────────────────────────────────────────────────────────── */
const PLATFORM_META = {
  INSTAGRAM: { label: "Instagram", color: "#E1306C", maxChars: 2200 },
  TWITTER:   { label: "X",         color: "#FFFFFF", maxChars: 280 },
  LINKEDIN:  { label: "LinkedIn",  color: "#0A66C2", maxChars: 3000 },
  TIKTOK:    { label: "TikTok",    color: "#67E8F9", maxChars: 2200 },
  YOUTUBE:   { label: "YouTube",   color: "#FF0000", maxChars: 5000 },
  FACEBOOK:  { label: "Facebook",  color: "#1877F2", maxChars: 63206 },
  THREADS:   { label: "Threads",   color: "#C4B5FD", maxChars: 500 },
} as const;

type PlatformId = keyof typeof PLATFORM_META;
const ALL_PLATFORMS: PlatformId[] = [
  "INSTAGRAM",
  "TWITTER",
  "LINKEDIN",
  "TIKTOK",
  "YOUTUBE",
  "FACEBOOK",
  "THREADS",
];

type AiAction = "improve" | "shorten" | "viral" | "professional" | "punchy" | "hashtags";
const AI_ACTIONS: { id: AiAction; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; desc: string }[] = [
  { id: "improve",      label: "Améliorer",   icon: Sparkles,   desc: "Clarifie + renforce" },
  { id: "shorten",      label: "Raccourcir",  icon: Scissors,   desc: "30-50 % en moins" },
  { id: "viral",        label: "Rendre viral",icon: Zap,        desc: "Hook + paragraphes courts" },
  { id: "professional", label: "Ton pro",     icon: Briefcase,  desc: "Style LinkedIn senior" },
  { id: "punchy",       label: "CTA fort",    icon: Megaphone,  desc: "Ajoute / renforce le CTA" },
  { id: "hashtags",     label: "Hashtags",    icon: Hash,       desc: "Suggère 6-10 #" },
];

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

interface InitialDraft {
  id: string;
  content: string;
  platforms: string[];
  mediaUrls: string[];
  scheduledAt: string | null;
  status: string;
  updatedAt: string;
}

interface ResumableDraft {
  id: string;
  content: string;
  platforms: string[];
  mediaUrls: string[];
  scheduledAt: string | null;
  updatedAt: string;
}

interface Props {
  user: { name: string | null; image: string | null };
  connectedPlatforms: string[];
  connectedAccounts: Array<{ platform: string; accountName: string }>;
  aiEnabled: boolean;
  plan: "FREE" | "PRO" | "AGENCY";
  initialDraft: InitialDraft | null;
  resumableDraft: ResumableDraft | null;
}

const AUTOSAVE_DEBOUNCE_MS = 1_500;

export default function StudioClient({
  user,
  connectedPlatforms,
  connectedAccounts,
  aiEnabled,
  initialDraft,
  resumableDraft,
}: Props) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(initialDraft?.id ?? null);
  const [content, setContent] = useState<string>(initialDraft?.content ?? "");
  const [platforms, setPlatforms] = useState<PlatformId[]>(
    (initialDraft?.platforms?.filter((p): p is PlatformId => p in PLATFORM_META) ??
      // Default sélection : si l'utilisateur n'a connecté qu'un seul réseau, on le pré-coche.
      (connectedPlatforms.length === 1 && connectedPlatforms[0] in PLATFORM_META
        ? [connectedPlatforms[0] as PlatformId]
        : []))
  );
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialDraft?.mediaUrls ?? []);
  const [scheduledAt, setScheduledAt] = useState<string | null>(
    initialDraft?.scheduledAt ?? null
  );
  const [scheduleMode, setScheduleMode] = useState<"draft" | "now" | "scheduled">(
    initialDraft?.scheduledAt ? "scheduled" : "draft"
  );
  const [previewTab, setPreviewTab] = useState<PlatformId>(
    (platforms[0] ?? "INSTAGRAM") as PlatformId
  );
  const [aiBusy, setAiBusy] = useState<AiAction | null>(null);
  const [hashtagSuggestion, setHashtagSuggestion] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [publishing, setPublishing] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(!!resumableDraft);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Char limits — un seul nombre, le + restrictif des plateformes sélectionnées
  const activeMaxChars = useMemo(() => {
    if (platforms.length === 0) return 2200;
    return Math.min(...platforms.map((p) => PLATFORM_META[p].maxChars));
  }, [platforms]);

  /* ─── Autosave : POST si pas d'id, PATCH si id, après debounce ─── */
  const runAutosave = useCallback(async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      // Rien à sauver
      return;
    }
    setSaveState({ kind: "saving" });
    try {
      const payload: Record<string, unknown> = {
        content,
        mediaUrls,
      };
      if (platforms.length > 0) payload.platforms = platforms;
      if (scheduledAt) payload.scheduledAt = scheduledAt;

      let id = postId;
      let res: Response;
      if (!id) {
        // Premier autosave : crée le draft.
        res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            // /api/posts requiert au minimum content + platforms, mais on
            // peut envoyer un brouillon sans tout. Fallback côté serveur.
            platforms: platforms.length > 0 ? platforms : connectedPlatforms.slice(0, 1),
          }),
        });
        if (!res.ok) {
          // Si platforms vides empêche la création (validation backend),
          // on tag saveState mais on n'embête pas l'utilisateur.
          setSaveState({ kind: "idle" });
          return;
        }
        const created = await res.json();
        id = created.id;
        setPostId(id);
      } else {
        res = await fetch(`/api/posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setSaveState({
            kind: "error",
            message: d.error ?? "Échec de sauvegarde.",
          });
          return;
        }
      }
      setSaveState({ kind: "saved", at: Date.now() });
    } catch {
      setSaveState({ kind: "error", message: "Pas de connexion réseau." });
    }
  }, [content, mediaUrls, platforms, postId, scheduledAt, connectedPlatforms]);

  // Debounce
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (!content.trim() && mediaUrls.length === 0) return;
    autosaveTimer.current = setTimeout(() => {
      void runAutosave();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, mediaUrls, platforms, scheduledAt]);

  /* ─── Resume draft ─── */
  const acceptResume = () => {
    if (!resumableDraft) return;
    setPostId(resumableDraft.id);
    setContent(resumableDraft.content);
    setPlatforms(
      resumableDraft.platforms.filter((p): p is PlatformId => p in PLATFORM_META) ?? []
    );
    setMediaUrls(resumableDraft.mediaUrls);
    setScheduledAt(resumableDraft.scheduledAt);
    if (resumableDraft.scheduledAt) setScheduleMode("scheduled");
    setResumeOpen(false);
    toast.success("Brouillon restauré.");
  };

  const dismissResume = () => setResumeOpen(false);

  /* ─── Platform toggle ─── */
  const togglePlatform = (p: PlatformId) => {
    setPlatforms((prev) => {
      const next = prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p];
      // Garde preview tab valide
      if (!next.includes(previewTab) && next.length > 0) setPreviewTab(next[0]);
      return next;
    });
  };

  /* ─── AI ───────────────────────────────────────────── */
  const runAi = async (action: AiAction) => {
    if (!aiEnabled) {
      toast.error("L'assistant IA est réservé aux plans Pro et Agence.");
      return;
    }
    if (!content.trim()) {
      toast.error("Écris quelques mots d'abord.");
      textareaRef.current?.focus();
      return;
    }
    setAiBusy(action);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          content,
          platforms,
          maxChars: activeMaxChars,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Erreur IA.");
        return;
      }
      if (action === "hashtags") {
        setHashtagSuggestion(data.text);
        toast.success("Hashtags suggérés ✨");
      } else {
        setContent(data.text);
        toast.success(`${AI_ACTIONS.find((a) => a.id === action)?.label} ✓`);
      }
    } catch {
      toast.error("Réseau indisponible. Réessaie.");
    } finally {
      setAiBusy(null);
    }
  };

  const insertHashtags = () => {
    if (!hashtagSuggestion) return;
    setContent((c) => `${c.trimEnd()}\n\n${hashtagSuggestion}`);
    setHashtagSuggestion(null);
  };

  /* ─── Publish ──────────────────────────────────────── */
  const doPublish = async (mode: "now" | "scheduled") => {
    if (!content.trim()) {
      toast.error("Le post est vide.");
      return;
    }
    if (platforms.length === 0) {
      toast.error("Sélectionne au moins une plateforme.");
      return;
    }
    if (mode === "scheduled") {
      if (!scheduledAt) {
        toast.error("Choisis une date et une heure.");
        return;
      }
      if (new Date(scheduledAt).getTime() <= Date.now()) {
        toast.error("La date de planification doit être dans le futur.");
        return;
      }
    }

    setPublishing(true);
    try {
      // Toujours partir d'un post sauvegardé (ID requis pour publish immédiat)
      let id = postId;
      if (!id) {
        const created = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            platforms,
            mediaUrls,
            scheduledAt: mode === "scheduled" ? scheduledAt : undefined,
          }),
        });
        if (!created.ok) {
          const d = await created.json().catch(() => ({}));
          throw new Error(d.error ?? "Création du post impossible.");
        }
        const c = await created.json();
        id = c.id;
        setPostId(id);
      } else {
        // Sync l'état avant publish
        await fetch(`/api/posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            platforms,
            mediaUrls,
            scheduledAt: mode === "scheduled" ? scheduledAt : null,
            status: mode === "scheduled" ? "SCHEDULED" : "DRAFT",
          }),
        });
      }

      if (mode === "scheduled") {
        toast.success("Post planifié ✓");
        router.push("/dashboard");
        return;
      }

      // Publication immédiate
      const pubRes = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
      const pubData = await pubRes.json().catch(() => ({}));
      type R = { canonicalPlatform?: string | null; platform: string; success: boolean; error?: string };
      const results: R[] = Array.isArray(pubData.results) ? pubData.results : [];
      const ok = results.filter((r) => r.success);
      const ko = results.filter((r) => !r.success);

      if (pubRes.ok && ok.length === results.length && ok.length > 0) {
        toast.success(`Publié sur ${ok.length} réseau${ok.length > 1 ? "x" : ""} ✓`);
        router.push("/dashboard");
      } else if (ok.length > 0) {
        toast.warning(
          `Publié sur ${ok.length}/${results.length}. Échec : ${ko.map((r) => r.canonicalPlatform ?? r.platform).join(", ")}`
        );
      } else {
        const first = ko[0]?.error || pubData.error || "Échec de publication.";
        toast.error(first);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  const saveExplicit = async () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    await runAutosave();
    toast.success("Brouillon sauvegardé.");
  };

  /* ─── Keyboard shortcuts ──────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "Enter") {
        e.preventDefault();
        const mode = scheduleMode === "scheduled" ? "scheduled" : "now";
        void doPublish(mode);
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveExplicit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, platforms, mediaUrls, scheduledAt, scheduleMode, postId]);

  /* ─── Helpers d'affichage ─────────────────────────── */
  const minDatetimeLocal = useMemo(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000); // dans 1h
    const tz = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tz * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }, []);

  const formatDatetimeLocalValue = (iso: string | null): string => {
    if (!iso) return "";
    const d = new Date(iso);
    const tz = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tz * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const onScheduleChange = (val: string) => {
    if (!val) {
      setScheduledAt(null);
      return;
    }
    setScheduledAt(new Date(val).toISOString());
  };

  return (
    <div style={{
      padding: "20px 24px 28px",
      maxWidth: 1400, margin: "0 auto",
      position: "relative", zIndex: 1,
    }}>
      {/* ─── Header bar ─────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, marginBottom: 18, flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{
            fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.4px",
          }}>Studio</h1>
          <p style={{ fontSize: "0.78rem", color: "var(--clr-muted)", marginTop: 2 }}>
            <StatusLabel state={saveState} hasContent={!!content.trim() || mediaUrls.length > 0} />
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={saveExplicit}
            disabled={publishing || (!content.trim() && mediaUrls.length === 0)}
            title="Sauvegarder (⌘S)"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10,
              border: "1px solid var(--clr-border2)",
              background: "var(--clr-card)", color: "var(--clr-text)",
              fontSize: "0.82rem", fontWeight: 600,
              cursor: publishing || (!content.trim() && mediaUrls.length === 0) ? "not-allowed" : "pointer",
              opacity: publishing || (!content.trim() && mediaUrls.length === 0) ? 0.55 : 1,
              fontFamily: "var(--font)",
            }}
          >
            <Save size={14} strokeWidth={2} />
            Sauver
          </button>
          <PublishButton
            mode={scheduleMode}
            scheduledAt={scheduledAt}
            disabled={publishing || !content.trim() || platforms.length === 0}
            busy={publishing}
            onPublish={(m) => doPublish(m)}
          />
        </div>
      </div>

      {/* ─── Resume banner ──────────────────────────────── */}
      {resumeOpen && resumableDraft && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", marginBottom: 14,
          borderRadius: 12,
          background: "linear-gradient(135deg, rgba(124,92,252,0.10), rgba(99,102,241,0.04))",
          border: "1px solid rgba(124,92,252,0.25)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(124,92,252,0.15)",
          }}>
            <Save size={14} color="#9B82FD" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.84rem", fontWeight: 600 }}>
              Brouillon non terminé · {formatTimeAgo(new Date(resumableDraft.updatedAt).getTime())}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--clr-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {resumableDraft.content?.slice(0, 90) || "(sans texte)"}
            </div>
          </div>
          <button
            type="button"
            onClick={acceptResume}
            style={{
              padding: "7px 14px", borderRadius: 10, border: "none",
              background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
              color: "#fff", fontSize: "0.78rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font)",
            }}
          >
            Reprendre
          </button>
          <button
            type="button"
            onClick={dismissResume}
            aria-label="Ignorer le brouillon"
            style={{
              width: 28, height: 28, borderRadius: 8, border: "1px solid var(--clr-border)",
              background: "transparent", color: "var(--clr-muted)",
              cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── Layout 2 colonnes : editor + preview ─────── */}
      <div className="studio-grid" style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 380px",
        gap: 18,
        alignItems: "start",
      }}>
        {/* ── Colonne EDITOR ──────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Plateformes */}
          <Card>
            <SectionHeader title="Plateformes" hint={connectedPlatforms.length === 0 ? "Aucun compte connecté" : `${connectedPlatforms.length} connecté${connectedPlatforms.length > 1 ? "s" : ""}`} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ALL_PLATFORMS.map((p) => {
                const meta = PLATFORM_META[p];
                const selected = platforms.includes(p);
                const isConnected = connectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    aria-pressed={selected}
                    title={isConnected ? `${meta.label} — connecté` : `${meta.label} — non connecté (le post sera créé mais ne pourra pas être publié)`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "8px 12px", borderRadius: 10,
                      fontSize: "0.8rem", fontWeight: 600,
                      cursor: "pointer", fontFamily: "var(--font)",
                      border: selected
                        ? `1px solid ${meta.color}80`
                        : "1px solid var(--clr-border)",
                      background: selected
                        ? `${meta.color}18`
                        : "transparent",
                      color: selected
                        ? (p === "TWITTER" ? "#E5E7EB" : meta.color)
                        : isConnected ? "var(--clr-text)" : "var(--clr-muted)",
                      position: "relative",
                      transition: "all 140ms ease",
                    }}
                  >
                    <SocialIcon platform={p} size={13} />
                    {meta.label}
                    {!isConnected && (
                      <span style={{
                        marginLeft: 2,
                        width: 4, height: 4, borderRadius: "50%",
                        background: "#FC5C7C", display: "inline-block",
                      }} title="Non connecté" />
                    )}
                  </button>
                );
              })}
            </div>
            {platforms.length === 0 && (
              <p style={{ marginTop: 10, fontSize: "0.74rem", color: "var(--clr-muted)" }}>
                Sélectionne au moins une plateforme pour publier.
              </p>
            )}
            {connectedPlatforms.length === 0 && (
              <Link
                href="/settings"
                style={{
                  marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: "0.76rem", fontWeight: 600, color: "var(--clr-primary-h)",
                  textDecoration: "none",
                }}
              >
                Connecter un compte →
              </Link>
            )}
          </Card>

          {/* Editor */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <SectionHeader title="Contenu" />
              <CharCounter current={content.length} max={activeMaxChars} platforms={platforms} />
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"Qu'as-tu envie de partager aujourd'hui ?\n\nL'IA peut t'aider à améliorer, raccourcir, viraliser ou ajouter des hashtags depuis la barre ci-dessous."}
              rows={10}
              style={{
                width: "100%", background: "transparent", border: "none",
                outline: "none", resize: "vertical",
                fontSize: "0.95rem", lineHeight: 1.65,
                color: "var(--clr-text)",
                fontFamily: "var(--font)",
                minHeight: 220,
                padding: 0,
              }}
            />

            {/* AI toolbar */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 6,
              paddingTop: 14, borderTop: "1px solid var(--clr-border)", marginTop: 6,
            }}>
              {AI_ACTIONS.map((a) => {
                const Icon = a.icon;
                const busy = aiBusy === a.id;
                const disabled = !content.trim() || !!aiBusy || !aiEnabled;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => runAi(a.id)}
                    disabled={disabled}
                    title={aiEnabled ? a.desc : "L'IA est réservée aux plans Pro et Agence"}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 11px", borderRadius: 9,
                      fontSize: "0.76rem", fontWeight: 600,
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.5 : 1,
                      border: "1px solid rgba(124,92,252,0.30)",
                      background: busy
                        ? "linear-gradient(135deg, rgba(124,92,252,0.30), rgba(155,130,253,0.18))"
                        : "rgba(124,92,252,0.08)",
                      color: "#C4B5FD",
                      fontFamily: "var(--font)",
                      transition: "background 140ms ease, transform 140ms ease",
                    }}
                  >
                    <Icon size={12} strokeWidth={2.2} />
                    {busy ? "…" : a.label}
                  </button>
                );
              })}
            </div>

            {/* Hashtag suggestion popover */}
            {hashtagSuggestion && (
              <div style={{
                marginTop: 12, padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(103,232,249,0.06)",
                border: "1px solid rgba(103,232,249,0.25)",
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              }}>
                <Hash size={14} color="#67E8F9" strokeWidth={2.2} />
                <div style={{ flex: 1, minWidth: 160, fontSize: "0.78rem", color: "#67E8F9", fontWeight: 500 }}>
                  {hashtagSuggestion}
                </div>
                <button
                  type="button"
                  onClick={insertHashtags}
                  style={{
                    padding: "5px 10px", borderRadius: 7, border: "none",
                    background: "rgba(103,232,249,0.18)", color: "#67E8F9",
                    fontSize: "0.74rem", fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--font)",
                  }}
                >
                  Insérer
                </button>
                <button
                  type="button"
                  onClick={() => setHashtagSuggestion(null)}
                  aria-label="Fermer la suggestion hashtags"
                  style={{
                    padding: 4, borderRadius: 6, border: "none",
                    background: "transparent", color: "var(--clr-muted)",
                    cursor: "pointer",
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </Card>

          {/* Media */}
          <Card>
            <SectionHeader title="Média" hint={mediaUrls.length > 0 ? `${mediaUrls.length} fichier${mediaUrls.length > 1 ? "s" : ""}` : "Optionnel"} />
            {mediaUrls.length > 0 && (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                gap: 8, marginBottom: 12,
              }}>
                {mediaUrls.map((url, i) => (
                  <div key={url} style={{
                    aspectRatio: "1 / 1", borderRadius: 8,
                    border: "1px solid var(--clr-border)", overflow: "hidden",
                    background: "var(--clr-card2)",
                    position: "relative",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => setMediaUrls((m) => m.filter((_, idx) => idx !== i))}
                      aria-label="Retirer ce média"
                      style={{
                        position: "absolute", top: 4, right: 4,
                        width: 22, height: 22, borderRadius: 6,
                        background: "rgba(6,7,11,0.7)", border: "1px solid rgba(255,255,255,0.18)",
                        color: "#fff", cursor: "pointer",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Upload onUploaded={(urls) => setMediaUrls((m) => [...m, ...urls])} />
          </Card>
        </div>

        {/* ── Colonne PREVIEW + SCHEDULE ─────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="studio-rail">
          {/* Scheduling */}
          <Card>
            <SectionHeader title="Publication" />
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12,
            }}>
              {(["draft", "scheduled", "now"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setScheduleMode(m)}
                  aria-pressed={scheduleMode === m}
                  style={{
                    padding: "8px 4px", borderRadius: 9,
                    fontSize: "0.76rem", fontWeight: 600,
                    cursor: "pointer", fontFamily: "var(--font)",
                    border: scheduleMode === m ? "1px solid rgba(124,92,252,0.45)" : "1px solid var(--clr-border)",
                    background: scheduleMode === m ? "rgba(124,92,252,0.14)" : "transparent",
                    color: scheduleMode === m ? "#C4B5FD" : "var(--clr-muted)",
                  }}
                >
                  {m === "draft" ? "Brouillon" : m === "scheduled" ? "Planifier" : "Maintenant"}
                </button>
              ))}
            </div>
            {scheduleMode === "scheduled" && (
              <div>
                <label style={{
                  display: "block", fontSize: "0.72rem", fontWeight: 600,
                  color: "var(--clr-muted)", marginBottom: 6,
                }}>
                  Date et heure (Europe/Paris)
                </label>
                <input
                  type="datetime-local"
                  value={formatDatetimeLocalValue(scheduledAt)}
                  min={minDatetimeLocal}
                  onChange={(e) => onScheduleChange(e.target.value)}
                  className="form-input"
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 10,
                    background: "var(--clr-card2)", border: "1px solid var(--clr-border)",
                    color: "var(--clr-text)", fontSize: "0.84rem",
                    fontFamily: "var(--font)",
                  }}
                />
                {scheduledAt && (
                  <p style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--clr-muted)" }}>
                    {formatRelative(scheduledAt)}
                  </p>
                )}
              </div>
            )}
            {scheduleMode === "now" && (
              <p style={{ fontSize: "0.74rem", color: "var(--clr-muted)", lineHeight: 1.55 }}>
                Publication immédiate sur les {platforms.length || 0} plateforme{platforms.length > 1 ? "s" : ""} sélectionnée{platforms.length > 1 ? "s" : ""}.
              </p>
            )}
            {scheduleMode === "draft" && (
              <p style={{ fontSize: "0.74rem", color: "var(--clr-muted)", lineHeight: 1.55 }}>
                Sauvegardé localement, non publié. Tu peux le retrouver depuis le dashboard.
              </p>
            )}
          </Card>

          {/* Preview */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <SectionHeader title="Aperçu" />
            </div>
            {/* Preview tabs */}
            <div style={{
              display: "flex", gap: 4, padding: 4, borderRadius: 10,
              background: "var(--clr-card2)", marginBottom: 12,
              overflowX: "auto",
            }}>
              {(platforms.length > 0 ? platforms : ([previewTab] as PlatformId[])).map((p) => {
                const meta = PLATFORM_META[p];
                const active = previewTab === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreviewTab(p)}
                    style={{
                      flex: 1, minWidth: 56,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "6px 8px", borderRadius: 7,
                      fontSize: "0.74rem", fontWeight: 600,
                      cursor: "pointer", fontFamily: "var(--font)",
                      border: "none",
                      background: active ? "var(--clr-card)" : "transparent",
                      color: active ? meta.color : "var(--clr-muted)",
                      boxShadow: active ? "0 0 0 1px var(--clr-border2)" : "none",
                    }}
                  >
                    <SocialIcon platform={p} size={11} />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <PreviewCard
              platform={previewTab}
              content={content}
              mediaUrl={mediaUrls[0] ?? null}
              user={user}
              accountName={connectedAccounts.find((a) => a.platform === previewTab)?.accountName ?? null}
            />
          </Card>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          :global(.studio-grid) {
            grid-template-columns: 1fr !important;
          }
          :global(.studio-rail) {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENTS
──────────────────────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--clr-card)",
      border: "1px solid var(--clr-border)",
      borderRadius: 14,
      padding: 18,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, gap: 8 }}>
      <h3 style={{
        fontSize: "0.74rem", fontWeight: 700, letterSpacing: "1.2px",
        textTransform: "uppercase", color: "var(--clr-muted)",
      }}>{title}</h3>
      {hint && (
        <span style={{ fontSize: "0.7rem", color: "var(--clr-muted)", opacity: 0.7 }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function StatusLabel({
  state,
  hasContent,
}: { state: SaveState; hasContent: boolean }) {
  if (state.kind === "saving") {
    return <span>Sauvegarde…</span>;
  }
  if (state.kind === "saved") {
    return (
      <span>
        Sauvegardé · <RelativeTime ts={state.at} />
      </span>
    );
  }
  if (state.kind === "error") {
    return <span style={{ color: "var(--clr-danger)" }}>⚠ {state.message}</span>;
  }
  return <span>{hasContent ? "Modifications non sauvegardées" : "Nouveau post"}</span>;
}

function RelativeTime({ ts }: { ts: number }) {
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(i);
  }, []);
  return <>{formatTimeAgo(ts)}</>;
}

function formatTimeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return "à l'instant";
  if (s < 60) return `il y a ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

function formatRelative(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "Date passée";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Dans ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Dans ${h} h`;
  const d = Math.floor(h / 24);
  return `Dans ${d} j`;
}

function CharCounter({
  current,
  max,
  platforms,
}: { current: number; max: number; platforms: PlatformId[] }) {
  const pct = Math.min((current / max) * 100, 100);
  const warn = current > max * 0.9;
  const over = current > max;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      fontVariantNumeric: "tabular-nums",
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: "50%",
        background: `conic-gradient(${over ? "var(--clr-danger)" : warn ? "#FCD34D" : "var(--clr-primary)"} ${pct}%, var(--clr-card2) 0)`,
      }} />
      <span style={{
        fontSize: "0.74rem", fontWeight: 600,
        color: over ? "var(--clr-danger)" : warn ? "#FCD34D" : "var(--clr-muted)",
      }}>
        {current.toLocaleString("fr-FR")} / {max.toLocaleString("fr-FR")}
        {platforms.length > 1 && " · le + restrictif"}
      </span>
    </div>
  );
}

function PublishButton({
  mode,
  scheduledAt,
  disabled,
  busy,
  onPublish,
}: {
  mode: "draft" | "now" | "scheduled";
  scheduledAt: string | null;
  disabled: boolean;
  busy: boolean;
  onPublish: (mode: "now" | "scheduled") => void;
}) {
  const isScheduled = mode === "scheduled";
  const isDraftOnly = mode === "draft";

  if (isDraftOnly) {
    return (
      <button
        type="button"
        disabled
        title="Mode brouillon : utilise le bouton Sauver"
        style={{
          padding: "9px 16px", borderRadius: 10, border: "1px solid var(--clr-border)",
          background: "var(--clr-card2)", color: "var(--clr-muted)",
          fontSize: "0.84rem", fontWeight: 600,
          cursor: "not-allowed", opacity: 0.6,
          fontFamily: "var(--font)",
        }}
      >
        Brouillon
      </button>
    );
  }

  const handleClick = () => onPublish(isScheduled ? "scheduled" : "now");
  const label = isScheduled
    ? scheduledAt ? "Planifier" : "Choisir une date"
    : "Publier";
  const Icon = isScheduled ? Calendar : Send;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || (isScheduled && !scheduledAt)}
      title={isScheduled ? "Planifier (⌘↵)" : "Publier maintenant (⌘↵)"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "9px 18px", borderRadius: 10, border: "none",
        background: "linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)",
        color: "#fff", fontSize: "0.84rem", fontWeight: 700,
        boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 22px -6px rgba(79,70,229,0.55)",
        cursor: disabled || (isScheduled && !scheduledAt) ? "not-allowed" : "pointer",
        opacity: disabled || (isScheduled && !scheduledAt) ? 0.55 : 1,
        fontFamily: "var(--font)",
      }}
    >
      <Icon size={14} strokeWidth={2.2} />
      {busy ? "Envoi…" : label}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────
   PREVIEW CARDS — rendu fidèle par plateforme
──────────────────────────────────────────────────────────── */

interface PreviewProps {
  platform: PlatformId;
  content: string;
  mediaUrl: string | null;
  user: { name: string | null; image: string | null };
  accountName: string | null;
}

function PreviewCard(props: PreviewProps) {
  const empty = !props.content.trim() && !props.mediaUrl;
  if (empty) {
    return (
      <div style={{
        padding: "32px 16px", textAlign: "center",
        borderRadius: 10, border: "1px dashed var(--clr-border2)",
      }}>
        <div style={{ fontSize: "1.6rem", marginBottom: 8 }}>🖼️</div>
        <p style={{ fontSize: "0.78rem", color: "var(--clr-muted)" }}>
          Commence à écrire pour voir l&apos;aperçu en temps réel.
        </p>
      </div>
    );
  }

  switch (props.platform) {
    case "LINKEDIN":
      return <LinkedInPreview {...props} />;
    case "TWITTER":
      return <XPreview {...props} />;
    case "INSTAGRAM":
      return <InstagramPreview {...props} />;
    case "TIKTOK":
      return <TikTokPreview {...props} />;
    case "THREADS":
      return <ThreadsPreview {...props} />;
    case "FACEBOOK":
      return <FacebookPreview {...props} />;
    case "YOUTUBE":
      return <YouTubePreview {...props} />;
  }
}

function Avatar({ name, image, size = 36 }: { name: string | null; image: string | null; size?: number }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="" width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#7C5CFC,#F06292)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 800, fontSize: size * 0.4,
    }}>
      {name?.charAt(0)?.toUpperCase() ?? "U"}
    </div>
  );
}

function PreviewContentText({ text, color = "inherit", whitePreLine = true }: { text: string; color?: string; whitePreLine?: boolean }) {
  return (
    <div style={{
      color,
      whiteSpace: whitePreLine ? "pre-wrap" : "normal",
      wordBreak: "break-word",
      lineHeight: 1.55,
    }}>
      {text}
    </div>
  );
}

/* ─── LinkedIn ─── */
function LinkedInPreview({ content, mediaUrl, user, accountName }: PreviewProps) {
  return (
    <div style={{
      background: "#fff", color: "#1A1A1A",
      borderRadius: 8, overflow: "hidden",
      border: "1px solid rgba(0,0,0,0.08)",
      fontFamily: "var(--font)",
    }}>
      <div style={{ padding: "12px 14px 10px", display: "flex", gap: 10 }}>
        <Avatar name={user.name} image={user.image} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.84rem", fontWeight: 700 }}>
            {accountName || user.name || "Vous"}
            <span style={{ color: "#666", fontSize: "0.72rem", fontWeight: 500 }}> · 1er</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#666" }}>Membre LinkedIn</div>
          <div style={{ fontSize: "0.72rem", color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
            Maintenant · 🌐
          </div>
        </div>
        <div style={{ color: "#666", fontSize: "1.3rem", lineHeight: 0.5 }}>···</div>
      </div>
      <div style={{ padding: "0 14px 12px", fontSize: "0.84rem" }}>
        <PreviewContentText text={content} color="#1A1A1A" />
      </div>
      {mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="" style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "cover" }} />
      )}
      <div style={{
        padding: "10px 14px", display: "flex", justifyContent: "space-around",
        borderTop: "1px solid rgba(0,0,0,0.07)",
        fontSize: "0.74rem", color: "#666",
      }}>
        <span>👍 J&apos;aime</span>
        <span>💬 Commenter</span>
        <span>↻ Partager</span>
        <span>➤ Envoyer</span>
      </div>
    </div>
  );
}

/* ─── X / Twitter ─── */
function XPreview({ content, mediaUrl, user, accountName }: PreviewProps) {
  const handle = (accountName || user.name || "vous").toLowerCase().replace(/\s+/g, "");
  return (
    <div style={{
      background: "#000", color: "#E5E7EB",
      borderRadius: 12, overflow: "hidden",
      border: "1px solid #2F3336",
      padding: 14,
      fontFamily: "var(--font)",
    }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Avatar name={user.name} image={user.image} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.86rem" }}>
            <span style={{ fontWeight: 700 }}>{user.name || "Vous"}</span>
            <span style={{ color: "#71767B", fontWeight: 400 }}>@{handle} · maintenant</span>
          </div>
          <div style={{ marginTop: 6, fontSize: "0.92rem" }}>
            <PreviewContentText text={content} color="#E5E7EB" />
          </div>
          {mediaUrl && (
            <div style={{ marginTop: 10, borderRadius: 14, overflow: "hidden", border: "1px solid #2F3336" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl} alt="" style={{ width: "100%", display: "block", maxHeight: 260, objectFit: "cover" }} />
            </div>
          )}
          <div style={{
            marginTop: 12, display: "flex", justifyContent: "space-between",
            fontSize: "0.78rem", color: "#71767B",
          }}>
            <span>💬</span>
            <span>🔁</span>
            <span>❤</span>
            <span>📊</span>
            <span>↗</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Instagram ─── */
function InstagramPreview({ content, mediaUrl, user, accountName }: PreviewProps) {
  const username = (accountName || user.name || "vous").toLowerCase().replace(/\s+/g, "");
  const firstLine = content.trim().split("\n")[0]?.slice(0, 120) ?? "";
  return (
    <div style={{
      background: "#000", color: "#FAFAFA",
      borderRadius: 8, overflow: "hidden",
      border: "1px solid #262626",
      fontFamily: "var(--font)",
    }}>
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          padding: 2, background: "linear-gradient(45deg, #F09433, #E6683C, #DC2743, #CC2366, #BC1888)",
        }}>
          <div style={{ background: "#000", borderRadius: "50%", padding: 1.5 }}>
            <Avatar name={user.name} image={user.image} size={25} />
          </div>
        </div>
        <span style={{ fontWeight: 600, fontSize: "0.86rem" }}>{username}</span>
        <span style={{ color: "#A8A8A8", fontSize: "0.8rem" }}>· Maintenant</span>
        <span style={{ marginLeft: "auto", color: "#FAFAFA" }}>···</span>
      </div>
      <div style={{
        width: "100%", aspectRatio: "1/1",
        background: mediaUrl
          ? `center / cover no-repeat url(${mediaUrl})`
          : "linear-gradient(135deg, #1A1A1A, #2A2A2A)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#666",
      }}>
        {!mediaUrl && <ImageIcon size={36} strokeWidth={1.2} />}
      </div>
      <div style={{ padding: "8px 12px", display: "flex", gap: 14, fontSize: "1.05rem" }}>
        <span>♡</span>
        <span>💬</span>
        <span>↗</span>
        <span style={{ marginLeft: "auto" }}>🔖</span>
      </div>
      <div style={{ padding: "0 12px 12px", fontSize: "0.82rem" }}>
        <span style={{ fontWeight: 600 }}>{username}</span>{" "}
        <span style={{ color: "#FAFAFA" }}>{firstLine}</span>
        {content.length > firstLine.length && (
          <span style={{ color: "#A8A8A8" }}> ... plus</span>
        )}
      </div>
    </div>
  );
}

/* ─── TikTok ─── */
function TikTokPreview({ content, mediaUrl, user, accountName }: PreviewProps) {
  const username = (accountName || user.name || "vous").toLowerCase().replace(/\s+/g, "");
  return (
    <div style={{
      width: "100%", maxWidth: 280, margin: "0 auto",
      aspectRatio: "9 / 16",
      borderRadius: 14, overflow: "hidden",
      border: "1px solid #1A1A1A",
      background: mediaUrl
        ? `center / cover no-repeat url(${mediaUrl})`
        : "linear-gradient(160deg, #1A1D2B 0%, #0C0E16 100%)",
      position: "relative",
      fontFamily: "var(--font)",
      color: "#fff",
    }}>
      {/* Right action stack */}
      <div style={{
        position: "absolute", right: 8, bottom: 50,
        display: "flex", flexDirection: "column", gap: 14, alignItems: "center",
        fontSize: "0.7rem",
      }}>
        <span style={{ fontSize: "1.1rem" }}>❤</span>
        <span style={{ fontSize: "1.05rem" }}>💬</span>
        <span style={{ fontSize: "1.05rem" }}>📤</span>
      </div>

      {/* Bottom overlay */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "14px 14px 12px",
        background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.7))",
      }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 4 }}>
          @{username}
        </div>
        <div style={{ fontSize: "0.72rem", lineHeight: 1.5 }}>
          <PreviewContentText text={content.slice(0, 140) + (content.length > 140 ? "…" : "")} color="#fff" />
        </div>
      </div>
    </div>
  );
}

/* ─── Threads ─── */
function ThreadsPreview({ content, mediaUrl, user, accountName }: PreviewProps) {
  const handle = (accountName || user.name || "vous").toLowerCase().replace(/\s+/g, "");
  return (
    <div style={{
      background: "#101010", color: "#FAFAFA",
      borderRadius: 10, padding: 14,
      border: "1px solid #1F1F1F",
      fontFamily: "var(--font)",
    }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Avatar name={user.name} image={user.image} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.84rem" }}>
            <span style={{ fontWeight: 600 }}>{handle}</span>
            <span style={{ color: "#777" }}>maintenant</span>
          </div>
          <div style={{ marginTop: 6, fontSize: "0.86rem" }}>
            <PreviewContentText text={content} color="#FAFAFA" />
          </div>
          {mediaUrl && (
            <div style={{ marginTop: 10, borderRadius: 10, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl} alt="" style={{ width: "100%", display: "block", maxHeight: 250, objectFit: "cover" }} />
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: "0.85rem", color: "#777", display: "flex", gap: 16 }}>
            <span>♡</span>
            <span>💬</span>
            <span>🔁</span>
            <span>📤</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Facebook ─── */
function FacebookPreview({ content, mediaUrl, user, accountName }: PreviewProps) {
  return (
    <div style={{
      background: "#fff", color: "#050505",
      borderRadius: 8, overflow: "hidden",
      border: "1px solid rgba(0,0,0,0.08)",
      fontFamily: "var(--font)",
    }}>
      <div style={{ padding: "12px 14px 8px", display: "flex", gap: 10 }}>
        <Avatar name={user.name} image={user.image} size={40} />
        <div>
          <div style={{ fontSize: "0.86rem", fontWeight: 600 }}>{accountName || user.name || "Vous"}</div>
          <div style={{ fontSize: "0.72rem", color: "#65676B" }}>Maintenant · 🌐</div>
        </div>
      </div>
      <div style={{ padding: "0 14px 12px", fontSize: "0.86rem" }}>
        <PreviewContentText text={content} color="#050505" />
      </div>
      {mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="" style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "cover" }} />
      )}
      <div style={{
        padding: "8px 14px", display: "flex", justifyContent: "space-around",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        fontSize: "0.78rem", color: "#65676B",
      }}>
        <span>👍 J&apos;aime</span>
        <span>💬 Commenter</span>
        <span>↻ Partager</span>
      </div>
    </div>
  );
}

/* ─── YouTube (community / shorts post simplifié) ─── */
function YouTubePreview({ content, mediaUrl, user, accountName }: PreviewProps) {
  return (
    <div style={{
      background: "#0F0F0F", color: "#fff",
      borderRadius: 10, overflow: "hidden",
      border: "1px solid #272727",
      padding: 14,
      fontFamily: "var(--font)",
    }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <Avatar name={user.name} image={user.image} size={36} />
        <div>
          <div style={{ fontSize: "0.84rem", fontWeight: 600 }}>{accountName || user.name || "Votre chaîne"}</div>
          <div style={{ fontSize: "0.72rem", color: "#AAA" }}>Maintenant</div>
        </div>
      </div>
      <div style={{ fontSize: "0.86rem", marginBottom: mediaUrl ? 10 : 0 }}>
        <PreviewContentText text={content} color="#fff" />
      </div>
      {mediaUrl && (
        <div style={{ borderRadius: 8, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="" style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover" }} />
        </div>
      )}
      <div style={{
        marginTop: 12, display: "flex", gap: 18, fontSize: "0.78rem", color: "#AAA",
      }}>
        <span>👍</span>
        <span>👎</span>
        <span>💬 Commentaires</span>
        <span style={{ marginLeft: "auto" }}>↻ Partager</span>
      </div>
    </div>
  );
}
