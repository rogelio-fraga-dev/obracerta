import type { ReactNode } from "react";
import { headers } from "next/headers";
import { config } from "@/lib/config";
import { PublicHeader } from "./_home/PublicHeader";
import { PublicFooter } from "./_home/PublicFooter";

/**
 * Layout das rotas públicas (SSR/SSG, SEO) — landing e perfil público. Header
 * sticky sempre legível (botões nunca somem ao rolar) + rodapé multi-coluna.
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAuthPage = pathname === "/entrar" || pathname === "/cadastro";

  if (isAuthPage) {
    return <main id="main-content">{children}</main>;
  }

  return (
    <div className="min-h-screen">
      <PublicHeader brandName={config.brand.name} />
      <main id="main-content">{children}</main>
      <PublicFooter brandName={config.brand.name} domain={config.brand.domain} />
    </div>
  );
}
