"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatCentavos,
  professionalPlanCatalog,
  professionalPlansOrdered,
  type ProfessionalPlan,
} from "@obracerta/shared";
import { Badge, Button, Card } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { FEATURE_UI } from "@/lib/billing-ui";

interface MeuPlanoProps {
  plano: string | null;
  features: string[];
}

function planoInfo(plano: string | null) {
  if (!plano) return null;
  return professionalPlanCatalog[plano as keyof typeof professionalPlanCatalog] ?? null;
}

/**
 * Painel "Meu plano" com **gating por plano** (funções liberadas/bloqueadas) e a
 * **opção de upgrade dentro do sistema** (§4.2). Ao trocar de plano, o backend
 * atualiza a assinatura e o `/me/entitlements` reflete as novas funções.
 */
export function MeuPlano({ plano, features }: MeuPlanoProps) {
  const router = useRouter();
  const liberadas = new Set(features);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const atual = planoInfo(plano);
  const precoAtual = atual?.precoCentavos ?? 0;
  const upgrades = professionalPlansOrdered.filter((p) => p.precoCentavos > precoAtual);

  async function fazerUpgrade(novo: ProfessionalPlan) {
    setError(null);
    setLoading(novo);
    try {
      await bff.post("/api/billing/upgrade", { plano: novo });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível fazer o upgrade.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-black text-foreground">Meu plano</h2>
        <Badge tone={plano ? "success" : "neutral"}>{atual?.nome ?? "Sem plano ativo"}</Badge>
      </div>

      {/* Funções reconhecidas pelo plano */}
      <ul className="space-y-2">
        {Object.entries(FEATURE_UI).map(([codigo, info]) => {
          const ativa = liberadas.has(codigo);
          return (
            <li key={codigo} className="flex items-start gap-2 text-sm">
              <span aria-hidden className={ativa ? "text-success" : "text-muted-foreground"}>
                {ativa ? "✓" : "🔒"}
              </span>
              <div>
                <span className={ativa ? "font-semibold text-foreground" : "text-muted-foreground"}>
                  {info.label}
                </span>
                <p className="text-xs text-muted-foreground">{info.desc}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Upgrade dentro do sistema */}
      {upgrades.length > 0 ? (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-bold text-foreground">Fazer upgrade</p>
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {upgrades.map((p) => (
              <div
                key={p.plano}
                className={`rounded-xl border-2 p-4 ${p.recomendado ? "border-primary" : "border-border"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-black text-foreground">{p.nome}</span>
                  {p.recomendado && <Badge tone="success">Recomendado</Badge>}
                </div>
                <div className="mt-0.5 text-sm font-bold text-primary">
                  {formatCentavos(p.precoCentavos)}/mês
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.resumo}</p>
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  onClick={() => fazerUpgrade(p.plano)}
                  disabled={loading !== null}
                >
                  {loading === p.plano ? "Atualizando…" : `Mudar para ${p.nome}`}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            O upgrade vale na hora — as novas funções são liberadas imediatamente.
          </p>
        </div>
      ) : (
        <p className="border-t border-border pt-4 text-sm text-muted-foreground">
          Você está no plano máximo. 🎉
        </p>
      )}
    </Card>
  );
}
