import type { ReactNode } from "react";
import { config } from "@/lib/config";

/**
 * Layout das rotas públicas (SSR/SSG, SEO) — landing e perfil público.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-display text-2xl font-black text-foreground">
          {config.brand.name}
        </span>
        {/* Navegação principal entra na Fase 5 (landing completa). */}
      </header>
      <main>{children}</main>
      <footer className="border-t border-border px-6 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} {config.brand.name}
      </footer>
    </div>
  );
}
