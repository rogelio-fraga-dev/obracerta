import type { Invoice, PaymentMethod } from "@obracerta/shared";

/** Dados para emitir uma fatura (origem exclusiva: assinatura OU compra). */
export interface CreateInvoiceData {
  userId: string;
  subscriptionId: string | null;
  purchaseId: string | null;
  gateway: string;
  gatewayId: string;
  valorCentavos: number;
  vencimentoEm: string; // ISO
}

/** Porta de saída das faturas. */
export interface InvoiceRepository {
  create(data: CreateInvoiceData): Promise<Invoice>;
  /** Localiza a fatura pela cobrança do gateway (para casar o webhook). */
  findByGatewayCharge(gateway: string, gatewayId: string): Promise<Invoice | null>;
  /** Marca a fatura como PAGA (idempotência/validade de transição checadas no service). */
  markPaid(id: string, metodo: PaymentMethod | null): Promise<Invoice | null>;
  listForUser(userId: string): Promise<Invoice[]>;
}

export const INVOICE_REPOSITORY = Symbol("INVOICE_REPOSITORY");
