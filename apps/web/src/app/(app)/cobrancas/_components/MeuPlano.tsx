"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatCentavos,
  professionalPlanCatalog,
  professionalPlansOrdered,
  contractorPlanCatalog,
  contractorPlansOrdered,
  type ProfessionalPlan,
} from "@obracerta/shared";
import { Badge, Button, Card } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { FEATURE_UI, CONTRACTOR_FEATURE_UI } from "@/lib/billing-ui";

interface MeuPlanoProps {
  plano: string | null;
  features: string[];
  /** Tipo da conta — define qual catálogo de planos exibir. */
  tipo?: string;
}

/**
 * Painel "Meu plano" **por persona**: profissional vê os planos do profissional
 * (com upgrade dentro do app) e contratante/empresa veem os planos de acesso do
 * contratante, com as features na ótica correta de cada um.
 */
export function MeuPlano({ plano, features, tipo }: MeuPlanoProps) {
  const router = useRouter();
  const isProfissional = tipo === "PROFISSIONAL";
  const liberadas = new Set(features);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featureUi = isProfissional ? FEATURE_UI : CONTRACTOR_FEATURE_UI;
  const atual = isProfissional
    ? (professionalPlanCatalog[plano as keyof typeof professionalPlanCatalog] ?? null)
    : (contractorPlanCatalog[plano as keyof typeof contractorPlanCatalog] ?? null);

  const precoAtual = atual?.precoCentavos ?? 0;
  const ordered = isProfissional ? professionalPlansOrdered : contractorPlansOrdered;
  const superiores = ordered.filter((p) => p.precoCentavos > precoAtual);

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

      {/* Funções reconhecidas pelo plano (rótulos na ótica da persona) */}
      <ul className="space-y-2">
        {Object.entries(featureUi).map(([codigo, info]) => {
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

      {/* Upgrade dentro do sistema — só profissional (assinatura). */}
      {isProfissional ? (
        superiores.length > 0 ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-bold text-foreground">Fazer upgrade</p>
            {error && (
              <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {superiores.map((p) => (
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
                    onClick={() => fazerUpgrade(p.plano as ProfessionalPlan)}
                    disabled={loading !== null}
                  >
                    {loading === p.plano ? "Atualizando…" : `Mudar para ${p.nome}`}
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Em ambiente de testes a troca é imediata. Em produção, o upgrade passará pelo pagamento da assinatura.
            </p>
          </div>
        ) : (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            Você está no plano máximo. 🎉
          </p>
        )
      ) : (
        // Contratante/Empresa: comparação dos planos de acesso (compra avulsa, 30 dias).
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-bold text-foreground">Planos de acesso</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {contractorPlansOrdered.map((p) => {
              const ehAtual = atual?.plano === p.plano;
              return (
                <div
                  key={p.plano}
                  className={`rounded-xl border-2 p-4 ${ehAtual ? "border-primary bg-primary/[0.04]" : "border-border"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-black text-foreground">{p.nome}</span>
                    {ehAtual && <Badge tone="success">Atual</Badge>}
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-primary">
                    {formatCentavos(p.precoCentavos)} <span className="font-normal text-muted-foreground">/ 30 dias</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {p.beneficios.map((b) => (
                      <li key={b} className="text-xs text-muted-foreground">• {b}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            A compra/renovação de plano de acesso será habilitada com o pagamento real (Asaas). Sua vigência atual aparece acima.
          </p>
        </div>
      )}
    </Card>
  );
}
