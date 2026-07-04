"use client";

import { Button } from "@obracerta/ui";

/** Abre o diálogo de impressão — o usuário salva em PDF ou imprime. */
export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      🖨️ Imprimir / salvar PDF
    </Button>
  );
}
