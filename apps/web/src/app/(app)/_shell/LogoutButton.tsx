"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { LogoutIcon } from "./icons";

/**
 * Botão de sair: chama o BFF (limpa cookies httpOnly) e volta ao login. Botão
 * **visível de verdade** (com borda + ícone), não um link discreto. `className`
 * permite ocupar a largura toda na Sidebar e ficar compacto no header mobile.
 */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await bff.post("/api/auth/logout");
    } catch {
      /* mesmo se falhar, seguimos pro login */
    }
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:border-danger/40 hover:bg-danger/5 hover:text-danger disabled:opacity-50",
        className,
      )}
    >
      <LogoutIcon className="h-4 w-4" />
      {loading ? "Saindo…" : "Sair"}
    </button>
  );
}
