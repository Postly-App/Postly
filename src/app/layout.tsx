import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Postly — Publiez partout. Grandissez partout.",
  description: "La plateforme tout-en-un pour planifier, publier et analyser vos contenus sur tous les réseaux sociaux. Propulsée par l'IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
