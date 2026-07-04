"use client";

import { useRouter } from "next/navigation";

/**
 * Botão de voltar para telas fora do shell logado (ex.: perfil público). Usa o
 * histórico quando existe (preserva filtros da busca); senão cai no `fallback`.
 */
export function BackButton({ fallback, label = "Voltar" }: { fallback: string; label?: string }) {
  const router = useRouter();

  function voltar() {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={voltar}
      className="-ml-1 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}
