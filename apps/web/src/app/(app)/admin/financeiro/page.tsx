import { ApiEnvelopeError, formatCentavos, type PendingRefundDetail, type HealthSnapshot } from "@obracerta/shared";
import { Card, Badge } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../../_shell/BackLink";
import { Resolver } from "../_components/Resolver";
import { FinanceChart } from "./_components/FinanceChart";
import { PAYMENT_METHOD_LABEL } from "@/lib/billing-ui";

type DetailedRefund = PendingRefundDetail;

/**
 * Fila do financeiro (FINANCEIRO/ADMIN): reembolsos pendentes para aprovar/recusar.
 * Auto-protegida pela API (403 → restrito).
 */
export default async function FinanceiroPage() {
  let pendentes: DetailedRefund[] = [];
  let metrics: HealthSnapshot | null = null;
  try {
    pendentes = await serverApi<DetailedRefund[]>("GET", "/refunds/pending");
    metrics = await serverApi<HealthSnapshot>("GET", "/admin/metrics");
  } catch (e) {
    if (e instanceof ApiEnvelopeError) {
      return (
        <section className="space-y-4">
          <h1 className="font-display text-2xl font-black text-foreground">Financeiro</h1>
          <Card>
            <p className="text-muted-foreground">Acesso restrito à equipe financeira.</p>
          </Card>
        </section>
      );
    }
    throw e;
  }

  return (
    <section aria-labelledby="fin-heading" className="space-y-8">
      <BackLink href="/admin" label="Painel" />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="fin-heading" className="font-display text-3xl font-black text-foreground">
            Painel Financeiro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral de monetização e fila de reembolsos.
          </p>
        </div>
      </header>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="p-2 bg-primary/10 rounded-lg text-primary text-xl font-bold">
                $
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider">Receita Recorrente Atual</h2>
            </div>
            <p className="text-3xl font-black text-foreground">
              {formatCentavos(metrics.monetizacao.mrrCentavos)}
            </p>
            <p className="text-xs text-muted-foreground">Receita recorrente mensal</p>
          </Card>

          <Card className="flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="p-2 bg-success/10 rounded-lg text-success text-xl font-bold">
                +
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider">Assinaturas</h2>
            </div>
            <p className="text-3xl font-black text-foreground">
              {metrics.monetizacao.assinaturasAtivas}
            </p>
            <p className="text-xs text-muted-foreground">Usuários com plano ativo</p>
          </Card>

          <Card className="flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="p-2 bg-danger/10 rounded-lg text-danger text-xl font-bold">
                !
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider">Taxa de Cancelamento</h2>
            </div>
            <p className="text-3xl font-black text-foreground">
              {(metrics.monetizacao.churnPct * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Cancelamentos no período</p>
          </Card>
        </div>
      )}

      <FinanceChart />

      <div className="pt-6 border-t border-border">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">
          Fila de Reembolsos ({pendentes.length})
        </h2>
        {pendentes.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed bg-muted/20">
            <p>Nenhum reembolso pendente de análise no momento.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendentes.map((r) => (
              <Card key={r.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-foreground block">
                      {formatCentavos(r.valorCentavos)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDateTimeBR(r.solicitadoEm)}</span>
                  </div>
                  <Badge tone="warning">Pendente</Badge>
                </div>

                <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solicitante:</span>
                    <span className="font-semibold text-foreground">
                      {r.cliente ? `${r.cliente.nome} (${r.cliente.email})` : "Desconhecido"}
                    </span>
                  </div>
                  {r.fatura && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Pago:</span>
                        <span className="font-semibold text-foreground">
                          {formatCentavos(r.fatura.valorCentavos)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Método Pago:</span>
                        <span className="font-semibold text-foreground">
                          {r.fatura.metodo ? PAYMENT_METHOD_LABEL[r.fatura.metodo as keyof typeof PAYMENT_METHOD_LABEL] : "Desconhecido"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paga em:</span>
                        <span className="font-semibold text-foreground">
                          {r.fatura.pagoEm ? formatDateTimeBR(r.fatura.pagoEm) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID da Transação:</span>
                        <span className="font-semibold text-mono text-[10px] text-foreground">
                          {r.fatura.gatewayId || "—"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3 bg-muted/30 rounded-lg text-sm text-foreground">
                  <span className="font-bold block mb-1">Motivo:</span>
                  {r.motivo}
                </div>
                <div className="mt-auto pt-4 border-t border-border">
                  <Resolver
                    action="/api/refunds/resolve"
                    payloadBase={{ refundId: r.id }}
                    options={[
                      { label: "Aprovar Reembolso", body: { aprovar: true } },
                      { label: "Recusar Reembolso", body: { aprovar: false }, variant: "secondary" },
                    ]}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
