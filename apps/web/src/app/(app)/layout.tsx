import type { ReactNode } from "react";
import type { BookingRequest, User } from "@obracerta/shared";
import { config } from "@/lib/config";
import { serverApi } from "@/lib/server-api";
import { getMyRoles, getProfileHint, requireSession } from "@/lib/session";
import { Sidebar } from "./_shell/Sidebar";
import { LogoutButton } from "./_shell/LogoutButton";
import { InstallPrompt } from "./_shell/InstallPrompt";
import { MobileHeader } from "./_shell/MobileHeader";

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

  // Foto do usuário (humaniza o shell) + pendências do profissional (badge no menu).
  const [user, pendingPedidos] = await Promise.all([
    serverApi<User>("GET", "/auth/me/profile").catch(() => null),
    isProfissional
      ? serverApi<BookingRequest[]>("GET", "/bookings/me/professional")
          .then((b) => b.filter((p) => p.status === "PENDENTE").length)
          .catch(() => 0)
      : Promise.resolve(0),
  ]);
  const fotoUrl = user?.fotoUrl ?? undefined;

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar
        brandName={config.brand.name}
        inicial={inicial}
        nome={hint?.nome}
        tipo={hint?.tipo}
        isAdmin={isAdmin}
        fotoUrl={fotoUrl}
        pendingPedidos={pendingPedidos}
      >
        <LogoutButton className="w-full" />
      </Sidebar>

      <div className="flex min-h-dvh flex-1 flex-col">
        <MobileHeader
          brandName={config.brand.name}
          inicial={inicial}
          nome={hint?.nome}
          tipo={hint?.tipo}
          isAdmin={isAdmin}
          fotoUrl={fotoUrl}
          pendingPedidos={pendingPedidos}
        />

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-6 pb-12 lg:px-12 lg:py-10 lg:pb-12"
        >
          {children}
        </main>
      </div>

      <InstallPrompt />
    </div>
  );
}
