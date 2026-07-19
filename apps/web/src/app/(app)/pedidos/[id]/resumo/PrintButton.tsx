"use client";

import { Printer } from "lucide-react";
import { Button } from "@obracerta/ui";

/** Abre o diálogo de impressão — o usuário salva em PDF ou imprime. */
export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()} className="inline-flex items-center gap-1.5">
      <Printer aria-hidden className="h-4 w-4" /> Imprimir / salvar PDF
    </Button>
  );
}
