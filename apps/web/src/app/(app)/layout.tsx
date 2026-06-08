import type { ReactNode } from "react";
import Link from "next/link";
import { config } from "@/lib/config";
import { getMyRoles, getProfileHint, requireSession } from "@/lib/session";
import { TabBar } from "./_shell/TabBar";
import { Sidebar } from "./_shell/Sidebar";
import { LogoutButton } from "./_shell/LogoutButton";
import { InstallPrompt } from "./_shell/InstallPrompt";

/**
 * Shell da área logada (route group `(app)`) — o PWA, **PC-first com
 * responsividade**. No desktop: Sidebar fixa à esquerda + conteúdo amplo. No
 * mobile: header compacto no topo + TabBar inferior. **Guarda de sessão no
 * servidor**: sem cookie válido, `requireSession` redireciona ao login.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();
  const hint = await getProfileHint();
  const roles = await getMyRoles();
  const isAdmin = roles.includes("ADMIN");
  const inicial = (hint?.nome ?? config.brand.name).charAt(0).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar brandName={config.brand.name} inicial={inicial} nome={hint?.nome} tipo={hint?.tipo} isAdmin={isAdmin}>
        <LogoutButton className="w-full" />
      </Sidebar>

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-5 py-3">
            <Link href="/perfil" className="flex items-center gap-2.5" aria-label="Meu perfil">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-base font-black text-primary-foreground">
                {inicial}
              </span>
              <span className="font-display text-lg font-black text-foreground">
                {config.brand.name}
              </span>
            </Link>
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-6 pb-24 lg:px-12 lg:py-10 lg:pb-12">
          {children}
        </main>
      </div>

      <InstallPrompt />
      <TabBar />
    </div>
  );
}
