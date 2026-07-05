"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@obracerta/ui";

/**
 * Estado de erro amigável para os `error.tsx` de rota (App Router). Substitui a
 * tela de erro crua do Next quando um Server Component falha por algo que não é
 * "não encontrado" (API fora do ar, timeout, 500). Oferece "tentar de novo"
 * (re-renderiza o segmento) e uma saída segura.
 */
export function ErrorState({
  reset,
  home = "/inicio",
  homeLabel = "Ir para o início",
}: {
  reset: () => void;
  home?: string;
  homeLabel?: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 text-warning"
      >
        <AlertTriangle className="h-8 w-8" />
      </span>
      <h1 className="font-display text-2xl font-black text-foreground">Algo deu errado</h1>
      <p className="text-sm text-muted-foreground">
        Tivemos um problema ao carregar esta tela. Pode ser instabilidade momentânea — tente de novo
        em instantes.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Tentar de novo</Button>
        <Button asChild variant="secondary">
          <Link href={home}>{homeLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
