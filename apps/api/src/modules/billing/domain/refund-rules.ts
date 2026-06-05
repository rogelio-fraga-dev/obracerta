import { InvoiceStatus } from "@obracerta/shared";

/**
 * Domínio puro do reembolso (roadmap §21 — CDC). Os 4 cenários de estorno:
 * arrependimento (Art. 49, 7 dias), cobrança indevida, falha de serviço (integrais)
 * e cancelamento proporcional (pro-rata do período não usado). Sem framework/ORM.
 */

/** Motivos de reembolso (catálogo CDC). Gravado em `refunds.motivo`. */
export const RefundReason = {
  /** Art. 49 CDC: direito de arrependimento em 7 dias → integral. */
  ARREPENDIMENTO: "ARREPENDIMENTO",
  /** Cobrança indevida/duplicada → integral. */
  COBRANCA_INDEVIDA: "COBRANCA_INDEVIDA",
  /** Serviço não prestado/falho → integral. */
  FALHA_SERVICO: "FALHA_SERVICO",
  /** Cancelamento no meio da vigência → proporcional ao tempo restante. */
  CANCELAMENTO_PROPORCIONAL: "CANCELAMENTO_PROPORCIONAL",
} as const;
export type RefundReason = (typeof RefundReason)[keyof typeof RefundReason];

/** Janela do direito de arrependimento (Art. 49 CDC). */
export const REGRET_WINDOW_DAYS = 7;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Só fatura PAGA pode ser estornada. */
export function canRefundInvoice(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.PAGA;
}

/**
 * Estorno proporcional: parte NÃO usada do período (linear). Antes do início =
 * integral; depois do fim = 0. Arredonda para o centavo.
 */
export function proportionalRefundCentavos(
  valorPagoCentavos: number,
  inicio: Date,
  fim: Date,
  now: Date,
): number {
  const total = fim.getTime() - inicio.getTime();
  if (total <= 0) return 0;
  const restante = Math.min(Math.max(0, fim.getTime() - now.getTime()), total);
  return Math.round(valorPagoCentavos * (restante / total));
}

/** Contexto para calcular o valor reembolsável. */
export interface RefundContext {
  reason: RefundReason;
  valorPagoCentavos: number;
  pagoEm: Date;
  now: Date;
  vigenciaInicio: Date | null;
  vigenciaFim: Date | null;
}

/** Valor a reembolsar em centavos (0 = não elegível). */
export function computeRefundCentavos(ctx: RefundContext): number {
  switch (ctx.reason) {
    case RefundReason.ARREPENDIMENTO: {
      const limite = ctx.pagoEm.getTime() + REGRET_WINDOW_DAYS * MS_POR_DIA;
      return ctx.now.getTime() <= limite ? ctx.valorPagoCentavos : 0;
    }
    case RefundReason.COBRANCA_INDEVIDA:
    case RefundReason.FALHA_SERVICO:
      return ctx.valorPagoCentavos;
    case RefundReason.CANCELAMENTO_PROPORCIONAL:
      if (!ctx.vigenciaInicio || !ctx.vigenciaFim) return 0;
      return proportionalRefundCentavos(
        ctx.valorPagoCentavos,
        ctx.vigenciaInicio,
        ctx.vigenciaFim,
        ctx.now,
      );
    default:
      return 0;
  }
}
