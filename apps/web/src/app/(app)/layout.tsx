import type { ReactNode } from "react";
import { config } from "@/lib/config";
import { requireSession } from "@/lib/session";
import { TabBar } from "./_shell/TabBar";
import { LogoutButton } from "./_shell/LogoutButton";
import { InstallPrompt } from "./_shell/InstallPrompt";

/**
 * Shell da área logada (route group `(app)`) — o PWA. **Guarda de sessão no
 * servidor**: sem cookie válido, `requireSession` redireciona ao login (não é só
 * esconder UI — a API também exige o token). Abas fixas no rodapé (mobile-first).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3.5 backdrop-blur">
        <span className="font-display text-xl font-black text-foreground">{config.brand.name}</span>
        <LogoutButton />
      </header>
      <main className="mx-auto max-w-2xl px-5 py-6">{children}</main>
      <InstallPrompt />
      <TabBar />
    </div>
  );
}
