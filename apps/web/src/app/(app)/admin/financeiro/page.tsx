import { ApiEnvelopeError, formatCentavos, type Refund } from "@obracerta/shared";
import { Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { formatDateTimeBR } from "@/lib/format";
import { Resolver } from "../_components/Resolver";

/**
 * Fila do financeiro (FINANCEIRO/ADMIN): reembolsos pendentes para aprovar/recusar.
 * Auto-protegida pela API (403 → restrito).
 */
export default async function FinanceiroPage() {
  let pendentes: Refund[];
  try {
    pendentes = await serverApi<Refund[]>("GET", "/refunds/pending");
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
    <section aria-labelledby="fin-heading" className="space-y-4">
      <h1 id="fin-heading" className="font-display text-2xl font-black text-foreground">
        Financeiro
      </h1>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-black text-foreground">
          Reembolsos pendentes ({pendentes.length})
        </h2>
        {pendentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum reembolso pendente.</p>
        ) : (
          <ul className="space-y-3">
            {pendentes.map((r) => (
              <li key={r.id} className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-black text-foreground">
                    {formatCentavos(r.valorCentavos)}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.motivo}</span>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTimeBR(r.solicitadoEm)}</p>
                <Resolver
                  action="/api/refunds/resolve"
                  payloadBase={{ refundId: r.id }}
                  options={[
                    { label: "Aprovar", body: { aprovar: true } },
                    { label: "Recusar", body: { aprovar: false }, variant: "secondary" },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
