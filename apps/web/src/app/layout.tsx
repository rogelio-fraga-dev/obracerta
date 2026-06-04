import "@obracerta/design-tokens/tokens.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${config.brand.name} — profissionais da construção civil`,
    template: `%s · ${config.brand.name}`,
  },
  description:
    "Marketplace de profissionais da construção civil com reputação verificada e agenda em tempo real.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
