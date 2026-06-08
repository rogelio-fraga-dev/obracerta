import type { ReactNode } from "react";
import Link from "next/link";
import { config } from "@/lib/config";

/**
 * Layout das rotas públicas (SSR/SSG, SEO) — landing e perfil público. Header com
 * navegação real (Entrar / Criar conta) — antes era só a marca, sem como entrar.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3.5 sm:px-10 lg:px-14">
          <Link href="/" aria-label={config.brand.name} className="flex items-center">
            {/* Preview da logo sem fundo. Quando a marca for finalizada, isto vira config/env. */}
            <img
              src="/brand/obracerta-logo.png"
              alt={config.brand.name}
              width={1120}
              height={305}
              className="h-9 w-auto sm:h-10"
            />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Acesso">
            <Link
              href="/entrar"
              className="rounded-md px-3 py-2 text-sm font-bold text-foreground hover:text-primary"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-md bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground transition-colors hover:bg-orange-400"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border px-6 py-10 text-sm text-muted-foreground sm:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-lg font-black text-foreground">{config.brand.name}</span>
          <span>© {new Date().getFullYear()} {config.brand.name} · Construção civil com confiança.</span>
        </div>
      </footer>
    </div>
  );
}
