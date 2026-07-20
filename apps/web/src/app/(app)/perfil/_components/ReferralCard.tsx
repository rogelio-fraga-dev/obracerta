"use client";

import { useState } from "react";
import { Check, Copy, Gift, Ticket } from "lucide-react";
import type { ReferralSummary } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";

/**
 * Painel do programa de indicação: mostra o código do usuário (com copiar),
 * quantas pessoas já indicou e os cupons de recompensa disponíveis.
 */
export function ReferralCard({ resumo }: { resumo: ReferralSummary }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resumo.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (contexto inseguro) — silencioso, o código está visível
    }
  }

  return (
    <div className="animate-fade-in delay-1 space-y-3">
      <div>
        <h2 className="font-display text-xl font-black text-foreground">Indique e ganhe</h2>
        <p className="text-sm text-muted-foreground">
          Compartilhe seu código. Quando um amigo se cadastra com ele, vocês dois ganham um cupom de
          desconto na assinatura.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <Gift className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Seu código
            </p>
            <p className="font-display text-2xl font-black tracking-wider text-foreground">
              {resumo.codigo}
            </p>
          </div>
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {copiado ? (
              <>
                <Check aria-hidden className="h-4 w-4 text-success" /> Copiado
              </>
            ) : (
              <>
                <Copy aria-hidden className="h-4 w-4" /> Copiar
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Pessoas que você indicou</span>
          <Badge tone={resumo.totalIndicados > 0 ? "success" : "neutral"}>
            {resumo.totalIndicados}
          </Badge>
        </div>

        {resumo.cuponsDisponiveis.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cupons disponíveis
            </p>
            <ul className="space-y-2">
              {resumo.cuponsDisponiveis.map((c) => (
                <li
                  key={c.codigo}
                  className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2"
                >
                  <Ticket aria-hidden className="h-4 w-4 shrink-0 text-success" />
                  <span className="font-mono text-sm font-bold text-foreground">{c.codigo}</span>
                  <span className="ml-auto text-sm text-muted-foreground">{c.resumo}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Use o código do cupom ao assinar um plano em Cobranças.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
