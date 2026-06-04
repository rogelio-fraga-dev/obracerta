import type { ReactNode } from "react";
import { config } from "@/lib/config";

/**
 * Layout da área logada (route group `(app)`) — será o PWA client-side (Fase 6).
 * Em Fase 0 é apenas um shell.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <span className="font-display text-xl font-black text-foreground">
          {config.brand.name}
        </span>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
