import { formatCentavos, type Invoice, professionalPlanCatalog, type Refund } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import {
  FEATURE_UI,
  INVOICE_STATUS_UI,
  PAYMENT_METHOD_LABEL,
  REFUND_STATUS_UI,
} from "@/lib/billing-ui";
import { formatDateTimeBR } from "@/lib/format";
import { RefundButton } from "./_components/RefundButton";

/** Forma da view de entitlements (plano vigente + features liberadas, §3/§17). */
interface EntitlementsView {
  plano: string | null;
  features: string[];
}

/** Nome amigável do plano (mapeia os do profissional; fallback no código). */
function planoLabel(plano: string | null): string {
  if (!plano) return "Sem plano ativo";
  const catalogo = professionalPlanCatalog[plano as keyof typeof professionalPlanCatalog];
  return catalogo ? catalogo.nome : plano;
}

async function MeuPlanoPanel() {
  const ent = await serverApi<EntitlementsView>("GET", "/me/entitlements");
  const liberadas = new Set(ent.features);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-black text-foreground">Meu plano</h2>
        <Badge tone={ent.plano ? "success" : "neutral"}>{planoLabel(ent.plano)}</Badge>
      </div>
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
    </Card>
  );
}

/**
 * Cobranças (Fase 4): faturas do usuário e reembolsos. O reembolso é solicitado
 * sobre uma fatura **paga** (CDC §21); o backend calcula o valor e um financeiro
 * resolve depois.
 */
export default async function CobrancasPage() {
  const [invoices, refunds] = await Promise.all([
    serverApi<Invoice[]>("GET", "/invoices/me"),
    serverApi<Refund[]>("GET", "/refunds/me"),
  ]);

  return (
    <section aria-labelledby="cobrancas-heading" className="space-y-5">
      <h1 id="cobrancas-heading" className="font-display text-2xl font-black text-foreground">
        Cobranças
      </h1>

      <MeuPlanoPanel />

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-black text-foreground">Faturas</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma fatura ainda.</p>
        ) : (
          <ul className="space-y-3">
            {invoices.map((inv) => {
              const ui = INVOICE_STATUS_UI[inv.status];
              return (
                <li key={inv.id} className="space-y-1.5 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-black text-foreground">
                      {formatCentavos(inv.valorCentavos)}
                    </span>
                    <Badge tone={ui.tone}>{ui.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vence {formatDateTimeBR(inv.vencimentoEm)}
                    {inv.metodo ? ` · ${PAYMENT_METHOD_LABEL[inv.metodo]}` : ""}
                    {inv.pagoEm ? ` · paga em ${formatDateTimeBR(inv.pagoEm)}` : ""}
                  </p>
                  {inv.status === "PAGA" && <RefundButton invoiceId={inv.id} />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-black text-foreground">Reembolsos</h2>
        {refunds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum reembolso solicitado.</p>
        ) : (
          <ul className="space-y-2">
            {refunds.map((r) => {
              const ui = REFUND_STATUS_UI[r.status];
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-foreground">{formatCentavos(r.valorCentavos)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{r.motivo}</span>
                  </div>
                  <Badge tone={ui.tone}>{ui.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}
