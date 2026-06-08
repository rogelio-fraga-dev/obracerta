import "@obracerta/design-tokens/tokens.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { config } from "@/lib/config";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

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
    <html lang="pt-BR">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
