"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

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
        console.error("Upload error:", error);
      }}
    />
  );
}
