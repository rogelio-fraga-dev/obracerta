"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bff } from "@/lib/client";

/** Botão de sair: chama o BFF (limpa cookies) e volta ao login. */
export function LogoutButton() {
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
      className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
    >
      {loading ? "Saindo…" : "Sair"}
    </button>
  );
}
