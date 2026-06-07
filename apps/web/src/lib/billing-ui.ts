import type { BadgeTone } from "@obracerta/ui";
import type { InvoiceStatus, PaymentMethod, RefundStatus } from "@obracerta/shared";

/** Rótulo + tom de cada estado de fatura. */
export const INVOICE_STATUS_UI: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  PENDENTE: { label: "Pendente", tone: "warning" },
  PAGA: { label: "Paga", tone: "success" },
  VENCIDA: { label: "Vencida", tone: "danger" },
  CANCELADA: { label: "Cancelada", tone: "neutral" },
  ESTORNADA: { label: "Estornada", tone: "info" },
};

/** Rótulo + tom de cada estado de reembolso. */
export const REFUND_STATUS_UI: Record<RefundStatus, { label: string; tone: BadgeTone }> = {
  SOLICITADO: { label: "Solicitado", tone: "warning" },
  APROVADO: { label: "Aprovado", tone: "info" },
  RECUSADO: { label: "Recusado", tone: "neutral" },
  CONCLUIDO: { label: "Concluído", tone: "success" },
};

/** Rótulo do método de pagamento. */
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CARTAO: "Cartão",
  BOLETO: "Boleto",
};

/** Motivos de reembolso (CDC §21) — códigos aceitos pelo backend + rótulos. */
export const REFUND_REASONS: { value: string; label: string }[] = [
  { value: "ARREPENDIMENTO", label: "Arrependimento (até 7 dias) — integral" },
  { value: "COBRANCA_INDEVIDA", label: "Cobrança indevida" },
  { value: "FALHA_SERVICO", label: "Falha no serviço" },
  { value: "CANCELAMENTO_PROPORCIONAL", label: "Cancelamento (proporcional)" },
];

/**
 * Rótulos amigáveis das features de plano (gating §3/§17). Os códigos são do
 * domínio do backend (`Feature`); aqui ganham nome e descrição para a UI.
 */
export const FEATURE_UI: Record<string, { label: string; desc: string }> = {
  "profile.public": { label: "Perfil público", desc: "Apareça nas buscas e tenha página própria." },
  "search.geo": { label: "Busca por proximidade", desc: "Encontre/seja encontrado por perto." },
  "search.unlimited": { label: "Busca ilimitada", desc: "Sem limite de resultados." },
  "bid.submit": { label: "Lances em obras", desc: "Participe das obras abertas." },
};
