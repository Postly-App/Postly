"use client";

import { UploadButton } from "@uploadthing/react";
import { Upload as UploadIcon, Loader2 } from "lucide-react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { logger } from "@/lib/logger";

interface Props {
  onUploaded?: (urls: string[]) => void;
}

export default function Upload({ onUploaded }: Props) {
  return (
    <UploadButton<OurFileRouter, "mediaUploader">
      endpoint="mediaUploader"
      onClientUploadComplete={(res) => {
        const urls = res.map((f) => f.ufsUrl ?? f.url);
        onUploaded?.(urls);
      }}
      onUploadError={(error) => {
        const code =
          error && typeof error === "object" && "data" in error
            ? String((error as { data?: { code?: unknown } }).data?.code ?? "")
            : "";
        logger.error("upload.client_failed", {
          route: "components:Upload",
          action: "onUploadError",
          outcome: code || "unknown",
          err: error,
        });
      }}
      appearance={{
        container: {
          width: "100%",
        },
        button: ({ ready, isUploading }) => ({
          width: "100%",
          height: 52,
          padding: "0 20px",
          borderRadius: 14,
          border: "1px solid rgba(124,92,252,0.32)",
          background: isUploading
            ? "linear-gradient(135deg, rgba(124,92,252,0.18), rgba(155,130,253,0.10))"
            : "linear-gradient(135deg, rgba(124,92,252,0.14), rgba(155,130,253,0.06))",
          color: "#F1F0FF",
          fontWeight: 700,
          fontSize: "0.92rem",
          letterSpacing: "-0.005em",
          fontFamily: "var(--font, inherit)",
          cursor: ready && !isUploading ? "pointer" : "wait",
          opacity: ready ? 1 : 0.7,
          transition: "all 180ms cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: ready && !isUploading
            ? "0 0 0 1px rgba(124,92,252,0.20) inset, 0 12px 28px -10px rgba(124,92,252,0.45), 0 0 22px -2px rgba(124,92,252,0.28)"
            : "0 0 0 1px rgba(124,92,252,0.15) inset",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }),
        allowedContent: {
          color: "#9B99B5",
          fontSize: "0.74rem",
          fontWeight: 500,
          marginTop: 8,
        },
      }}
      content={{
        button({ ready, isUploading, uploadProgress }) {
          if (isUploading) {
            return (
              <>
                <Loader2
                  size={16}
                  className="upload-spin"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
                <span>
                  Envoi en cours…
                  {typeof uploadProgress === "number"
                    ? ` ${Math.round(uploadProgress)} %`
                    : ""}
                </span>
              </>
            );
          }
          if (!ready) {
            return (
              <>
                <Loader2
                  size={16}
                  className="upload-spin"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
                <span>Préparation…</span>
              </>
            );
          }
          return (
            <>
              <UploadIcon size={17} strokeWidth={2.2} aria-hidden="true" />
              <span>Importer un média</span>
            </>
          );
        },
        allowedContent({ ready, fileTypes, isUploading }) {
          if (!ready) return "Initialisation du composant…";
          if (isUploading) return "Ne ferme pas l'onglet pendant l'envoi";
          if (!fileTypes?.length)
            return "Images & vidéos — glisse ou clique pour importer";
          return `${fileTypes.join(", ")} — glisse ou clique pour importer`;
        },
      }}
    />
  );
}
