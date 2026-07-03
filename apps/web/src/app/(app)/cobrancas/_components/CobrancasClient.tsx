"use client";

import { useState } from "react";
import { Badge, Card } from "@obracerta/ui";
import { formatCentavos, type Invoice, type Refund } from "@obracerta/shared";
import { INVOICE_STATUS_UI, PAYMENT_METHOD_LABEL, REFUND_STATUS_UI } from "@/lib/billing-ui";
import { formatDateTimeBR } from "@/lib/format";
import { RefundButton } from "./RefundButton";
import { MeuPlano } from "./MeuPlano";

interface CobrancasClientProps {
  invoices: Invoice[];
  refunds: Refund[];
  plano: string | null;
  features: string[];
  tipo?: string;
}

type Tab = "plano" | "faturas" | "suporte";

export function CobrancasClient({ invoices, refunds, plano, features, tipo }: CobrancasClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("plano");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: "Como funciona o reembolso?",
      a: "Reembolsos de faturas podem ser solicitados em até 7 dias após o pagamento (direito de arrependimento CDC), desde que os recursos premium não tenham sido totalmente consumidos. O reembolso é solicitado clicando no botão ao lado da fatura paga nesta tela.",
    },
    {
      q: "Posso mudar de plano a qualquer momento?",
      a: "Sim! Você pode fazer o upgrade a qualquer momento pelo aplicativo. O valor restante do seu plano atual será calculado como desconto proporcional na assinatura do novo plano.",
    },
    {
      q: "Quais as formas de pagamento aceitas?",
      a: "Aceitamos cartões de crédito (com recorrência automática para assinaturas profissionais), Pix e boleto bancário.",
    },
    {
      q: "Onde vejo minhas Notas Fiscais?",
      a: "As notas fiscais de serviço são emitidas automaticamente pela prefeitura e enviadas para o e-mail cadastrado em sua conta em até 48 horas após a confirmação do pagamento.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Tabs de Navegação ── */}
      <div className="flex border-b border-border text-sm font-semibold">
        <button
          onClick={() => setActiveTab("plano")}
          className={`py-3 px-4 border-b-2 transition-all ${
            activeTab === "plano"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Meu Plano
        </button>
        <button
          onClick={() => setActiveTab("faturas")}
          className={`py-3 px-4 border-b-2 transition-all ${
            activeTab === "faturas"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Faturas
        </button>
        <button
          onClick={() => setActiveTab("suporte")}
          className={`py-3 px-4 border-b-2 transition-all ${
            activeTab === "suporte"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Suporte e Reembolsos
        </button>
      </div>

      <div className="animate-fade-in">
        {/* ── TAB: Meu Plano ── */}
        {activeTab === "plano" && (
          <MeuPlano plano={plano} features={features} tipo={tipo} />
        )}

        {/* ── TAB: Faturas ── */}
        {activeTab === "faturas" && (
          <Card className="space-y-4">
            <div className="border-b border-border pb-2">
              <h2 className="font-display text-lg font-black text-foreground">Histórico de Faturas</h2>
              <p className="text-xs text-muted-foreground">Veja seus pagamentos e faturas emitidas no sistema.</p>
            </div>

            {invoices.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma fatura encontrada.
              </p>
            ) : (
              <>
                {/* Desktop: tabela */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-4">Valor</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Vencimento</th>
                        <th className="py-3 px-4">Método</th>
                        <th className="py-3 px-4">Paga em</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoices.map((inv) => {
                        const ui = INVOICE_STATUS_UI[inv.status];
                        return (
                          <tr key={inv.id} className="hover:bg-muted/10">
                            <td className="py-3.5 px-4 font-bold text-foreground">
                              {formatCentavos(inv.valorCentavos)}
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge tone={ui.tone} size="sm">{ui.label}</Badge>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                              {formatDateTimeBR(inv.vencimentoEm)}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-foreground">
                              {inv.metodo ? PAYMENT_METHOD_LABEL[inv.metodo] : "—"}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                              {inv.pagoEm ? formatDateTimeBR(inv.pagoEm) : "—"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {inv.status === "PAGA" && (
                                <RefundButton invoiceId={inv.id} />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: cards */}
                <ul className="space-y-3 sm:hidden">
                  {invoices.map((inv) => {
                    const ui = INVOICE_STATUS_UI[inv.status];
                    return (
                      <li
                        key={inv.id}
                        className="rounded-xl border border-border p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-display text-lg font-black text-foreground">
                            {formatCentavos(inv.valorCentavos)}
                          </span>
                          <Badge tone={ui.tone} size="sm">{ui.label}</Badge>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                          <dt className="text-muted-foreground">Vencimento</dt>
                          <dd className="text-right font-medium text-foreground">
                            {formatDateTimeBR(inv.vencimentoEm)}
                          </dd>
                          <dt className="text-muted-foreground">Método</dt>
                          <dd className="text-right font-medium text-foreground">
                            {inv.metodo ? PAYMENT_METHOD_LABEL[inv.metodo] : "—"}
                          </dd>
                          <dt className="text-muted-foreground">Paga em</dt>
                          <dd className="text-right font-medium text-foreground">
                            {inv.pagoEm ? formatDateTimeBR(inv.pagoEm) : "—"}
                          </dd>
                        </dl>
                        {inv.status === "PAGA" && (
                          <div className="flex justify-end border-t border-border/60 pt-2.5">
                            <RefundButton invoiceId={inv.id} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Card>
        )}

        {/* ── TAB: Suporte e Reembolsos ── */}
        {activeTab === "suporte" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Canais de Suporte */}
              <Card className="space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-lg font-black text-foreground">Precisa de Ajuda?</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Nossa equipe de suporte financeiro está à disposição para ajudar com dúvidas sobre cobranças, problemas em assinaturas ou pedidos de reembolso.
                  </p>
                </div>
                <div className="space-y-2 mt-4">
                  <a
                    href="https://wa.me/5511999999999?text=Ol%C3%A1%21+Preciso+de+suporte+com+cobran%C3%A7as+no+ObraCerta."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] transition-all px-4 py-3 font-semibold text-white shadow-sm"
                  >
                    <span>💬 Falar no WhatsApp</span>
                  </a>
                  <a
                    href="mailto:suporte@obracerta.com.br"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border hover:bg-muted transition-all px-4 py-3 font-semibold text-foreground"
                  >
                    <span>✉ Enviar E-mail</span>
                  </a>
                </div>
              </Card>

              {/* Solicitações de Reembolso */}
              <Card className="space-y-4">
                <h3 className="font-display text-lg font-black text-foreground">Solicitações de Reembolso</h3>
                {refunds.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Nenhum reembolso solicitado.</p>
                ) : (
                  <ul className="space-y-3 divide-y divide-border">
                    {refunds.map((r) => {
                      const ui = REFUND_STATUS_UI[r.status];
                      return (
                        <li key={r.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-sm">
                          <div>
                            <span className="font-bold text-foreground">{formatCentavos(r.valorCentavos)}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{r.motivo}</p>
                          </div>
                          <Badge tone={ui.tone} size="sm">{ui.label}</Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {/* FAQ Accordion */}
            <Card className="space-y-4">
              <h3 className="font-display text-lg font-black text-foreground">Perguntas Frequentes</h3>
              <div className="space-y-2 mt-2">
                {faqItems.map((item, index) => (
                  <div key={index} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-4 font-semibold text-sm text-foreground bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                    >
                      <span>{item.q}</span>
                      <span className="text-muted-foreground font-display text-base">
                        {openFaq === index ? "−" : "+"}
                      </span>
                    </button>
                    {openFaq === index && (
                      <div className="p-4 text-sm text-muted-foreground leading-relaxed bg-background border-t border-border animate-fade-in">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
