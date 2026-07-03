import type { ReactNode } from "react";
import { config } from "@/lib/config";
import { getMyRoles, getProfileHint, requireSession } from "@/lib/session";
import { Sidebar } from "./_shell/Sidebar";
import { LogoutButton } from "./_shell/LogoutButton";
import { InstallPrompt } from "./_shell/InstallPrompt";
import { MobileHeader } from "./_shell/MobileHeader";
import { TabBar } from "./_shell/TabBar";

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
        <MobileHeader
          brandName={config.brand.name}
          inicial={inicial}
          nome={hint?.nome}
          tipo={hint?.tipo}
          isAdmin={isAdmin}
        />

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-6 pb-28 lg:px-12 lg:py-10 lg:pb-12"
        >
          {children}
        </main>

        {/* Navegação inferior — só no mobile (a Sidebar cobre o desktop). */}
        <TabBar tipo={hint?.tipo} />
      </div>

      <InstallPrompt />
    </div>
  );
}
