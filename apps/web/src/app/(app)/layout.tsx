import type { ReactNode } from "react";
import Link from "next/link";
import { config } from "@/lib/config";
import { getProfileHint, requireSession } from "@/lib/session";
import { TabBar } from "./_shell/TabBar";
import { LogoutButton } from "./_shell/LogoutButton";
import { InstallPrompt } from "./_shell/InstallPrompt";

/**
 * Shell da área logada (route group `(app)`) — o PWA. **Guarda de sessão no
 * servidor**: sem cookie válido, `requireSession` redireciona ao login. Header com
 * avatar + marca; abas fixas no rodapé (mobile-first).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();
  const hint = await getProfileHint();
  const inicial = (hint?.nome ?? config.brand.name).charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/perfil" className="flex items-center gap-2.5" aria-label="Meu perfil">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-base font-black text-primary-foreground">
              {inicial}
            </span>
            <span className="font-display text-lg font-black text-foreground">{config.brand.name}</span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-6">{children}</main>
      <InstallPrompt />
      <TabBar />
    </div>
  );
}
