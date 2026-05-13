"use client";

import { UploadButton } from "@uploadthing/react";
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
    />
  );
}
