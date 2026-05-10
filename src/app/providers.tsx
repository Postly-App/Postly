"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#111118",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#F1F0FF",
          },
        }}
      />
    </SessionProvider>
  );
}
