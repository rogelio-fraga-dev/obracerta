import "@obracerta/design-tokens/tokens.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { config } from "@/lib/config";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

import { headers } from "next/headers";

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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: `${config.brand.name} — profissionais da construção civil`,
    template: `%s · ${config.brand.name}`,
  },
  description:
    "Marketplace de profissionais da construção civil com reputação verificada e agenda em tempo real.",
  // PWA: o manifest vem de app/manifest.ts; aqui declaramos ícones + comportamento iOS.
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: config.brand.name },
};

export const viewport: Viewport = {
  themeColor: "#e8560a",
  // Tela cheia edge-to-edge no PWA; os insets de safe-area cuidam do notch/island.
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`} nonce={nonce} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-primary-foreground"
        >
          Pular para o conteúdo
        </a>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
