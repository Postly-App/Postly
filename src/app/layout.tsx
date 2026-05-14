import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Postly — Mission control pour ta présence sociale",
  description:
    "La console de pilotage qui planifie, publie et analyse tes contenus sur tous les réseaux sociaux. Propulsée par l'IA.",
  applicationName: "Postly",
  authors: [{ name: "Postly" }],
  metadataBase: new URL("https://www.getpostly.space"),
  openGraph: {
    title: "Postly",
    description: "Mission control pour ta présence sociale.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#06070B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
