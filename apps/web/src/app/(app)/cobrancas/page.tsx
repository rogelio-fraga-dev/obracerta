import { formatCentavos, type Invoice, type Refund } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { INVOICE_STATUS_UI, PAYMENT_METHOD_LABEL, REFUND_STATUS_UI } from "@/lib/billing-ui";
import { formatDateTimeBR } from "@/lib/format";
import { RefundButton } from "./_components/RefundButton";
import { MeuPlano } from "./_components/MeuPlano";

/** Forma da view de entitlements (plano vigente + features liberadas, §3/§17). */
interface EntitlementsView {
  plano: string | null;
  features: string[];
}

/**
 * Cobranças (Fase 4): faturas do usuário e reembolsos. O reembolso é solicitado
 * sobre uma fatura **paga** (CDC §21); o backend calcula o valor e um financeiro
 * resolve depois.
 */
export default async function CobrancasPage() {
  const [invoices, refunds, ent, hint] = await Promise.all([
    serverApi<Invoice[]>("GET", "/invoices/me"),
    serverApi<Refund[]>("GET", "/refunds/me"),
    serverApi<EntitlementsView>("GET", "/me/entitlements"),
    getProfileHint(),
  ]);

  return (
    <section aria-labelledby="cobrancas-heading" className="space-y-5">
      <h1 id="cobrancas-heading" className="font-display text-2xl font-black text-foreground">
        Cobranças
      </h1>

      <MeuPlano plano={ent.plano} features={ent.features} tipo={hint?.tipo} />

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
