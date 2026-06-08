import "@obracerta/design-tokens/tokens.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { config } from "@/lib/config";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// Tipografia da marca: Fraunces (títulos) + Plus Jakarta Sans (corpo, no lugar do
// Cabinet Grotesk, que não está no Google Fonts). Expostas como CSS variables que
// os tokens consomem (`--font-display`/`--font-sans`).
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${config.brand.name} — profissionais da construção civil`,
    template: `%s · ${config.brand.name}`,
  },
  description:
    "Marketplace de profissionais da construção civil com reputação verificada e agenda em tempo real.",
  // PWA: o manifest vem de app/manifest.ts; aqui declaramos o comportamento iOS.
  appleWebApp: { capable: true, statusBarStyle: "default", title: config.brand.name },
};

export const viewport: Viewport = {
  themeColor: "#e8560a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
