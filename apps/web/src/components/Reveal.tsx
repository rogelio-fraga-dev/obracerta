"use client";

import { Children, useState, type ReactNode } from "react";
import { Button } from "@obracerta/ui";

/**
 * Revela uma lista longa em lotes ("Mostrar mais") — os itens chegam já
 * renderizados do servidor; aqui só controlamos quantos aparecem. Corta o custo
 * de pintar centenas de cards de uma vez sem mudar contratos da API.
 */
export function Reveal({ step = 20, children }: { step?: number; children: ReactNode }) {
  const items = Children.toArray(children);
  const [count, setCount] = useState(step);
  const restante = items.length - count;

  return (
    <>
      {items.slice(0, count)}
      {restante > 0 && (
        // <li> para ser HTML válido dentro dos <ul> das listas; col-span-full
        // cobre o caso de grade (obras).
        <li className="col-span-full list-none pt-2 text-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCount((c) => c + step)}
          >
            Mostrar mais ({restante} restante{restante > 1 ? "s" : ""})
          </Button>
        </li>
      )}
    </>
  );
}
