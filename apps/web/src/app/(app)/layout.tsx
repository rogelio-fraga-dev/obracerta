import type { ReactNode } from "react";
import type { NotificationSummary, User } from "@obracerta/shared";
import { config } from "@/lib/config";
import { serverApi } from "@/lib/server-api";
import { getMyRoles, getProfileHint, requireSession } from "@/lib/session";
import { ToastProvider } from "@/components/Toast";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Sidebar } from "./_shell/Sidebar";
import { LogoutButton } from "./_shell/LogoutButton";
import { InstallPrompt } from "./_shell/InstallPrompt";
import { MobileHeader } from "./_shell/MobileHeader";
import { BottomNav } from "./_shell/BottomNav";

/**
 * Shell da área logada (route group `(app)`) — o PWA, **PC-first com
 * responsividade**. No desktop: Sidebar fixa à esquerda + conteúdo amplo. No
 * mobile: header compacto no topo com Início + Menu (drawer). **Guarda de sessão no
 * servidor**: sem cookie válido, `requireSession` redireciona ao login.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();
  const hint = await getProfileHint();
  const roles = await getMyRoles();
  const isAdmin = roles.includes("ADMIN");
  const inicial = (hint?.nome ?? config.brand.name).charAt(0).toUpperCase();
  const isProfissional = hint?.tipo === "PROFISSIONAL";

  // Foto do usuário (humaniza o shell) + pendências do profissional (badge no
  // menu) + notificações não lidas (sino).
  const [user, pendingPedidos, notifSummary] = await Promise.all([
    serverApi<User>("GET", "/auth/me/profile").catch(() => null),
    isProfissional
      ? serverApi<{ total: number }>("GET", "/bookings/me/professional/pending-count")
          .then((r) => r.total)
          .catch(() => 0)
      : Promise.resolve(0),
    serverApi<NotificationSummary>("GET", "/notifications/me/summary").catch(() => null),
  ]);
  const fotoUrl = user?.fotoUrl ?? undefined;
  const naoLidas = notifSummary?.naoLidas ?? 0;

  return (
    <ToastProvider>
    {/* overflow-x-clip + min-w-0: nenhum filho consegue alargar o documento além
        do viewport (a causa do corte à direita no mobile — flex row sem min-width). */}
    <div className="flex min-h-dvh overflow-x-clip bg-background">
      <Sidebar
        brandName={config.brand.name}
        inicial={inicial}
        nome={hint?.nome}
        tipo={hint?.tipo}
        isAdmin={isAdmin}
        fotoUrl={fotoUrl}
        pendingPedidos={pendingPedidos}
        naoLidas={naoLidas}
      >
        <LogoutButton className="w-full" />
      </Sidebar>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <MobileHeader
          brandName={config.brand.name}
          inicial={inicial}
          nome={hint?.nome}
          tipo={hint?.tipo}
          isAdmin={isAdmin}
          fotoUrl={fotoUrl}
          pendingPedidos={pendingPedidos}
          naoLidas={naoLidas}
        />

        <main
          id="main-content"
          // pb-28 no mobile abre espaço para o BottomNav fixo; no desktop volta ao normal.
          className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 overflow-x-clip px-4 py-5 pb-28 sm:px-5 sm:py-6 lg:px-12 lg:py-10 lg:pb-12"
        >
          {children}
        </main>
      </div>

      <BottomNav tipo={hint?.tipo} isAdmin={isAdmin} pendingPedidos={pendingPedidos} />

      <InstallPrompt />
    </div>
    </ToastProvider>
  );
}
