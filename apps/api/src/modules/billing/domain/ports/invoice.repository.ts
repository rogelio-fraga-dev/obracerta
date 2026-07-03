import type { Invoice, InvoiceStatus, PaymentMethod } from "@obracerta/shared";

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
  findById(id: string): Promise<Invoice | null>;
  /** Localiza a fatura pela cobrança do gateway (para casar o webhook). */
  findByGatewayCharge(gateway: string, gatewayId: string): Promise<Invoice | null>;
  /** Marca a fatura como PAGA (idempotência/validade de transição checadas no service). */
  markPaid(id: string, metodo: PaymentMethod | null): Promise<Invoice | null>;
  /** Vincula (ou revincula) a fatura a uma cobrança do gateway — backfill do Pix. */
  attachGatewayCharge(id: string, gateway: string, gatewayId: string): Promise<Invoice | null>;
  /** Transição guardada de status (só muda se o status atual for `from`). */
  transition(id: string, from: InvoiceStatus, to: InvoiceStatus): Promise<Invoice | null>;
  listForUser(userId: string): Promise<Invoice[]>;
}

export const INVOICE_REPOSITORY = Symbol("INVOICE_REPOSITORY");
