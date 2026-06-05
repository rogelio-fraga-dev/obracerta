import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export const BILLING_QUEUE = "billing-jobs";

/** Job: vencer uma fatura PENDENTE no vencimento. */
export interface InvoiceDueJobData {
  invoiceId: string;
}
/** Job: expirar uma compra avulsa ATIVO ao fim da vigência. */
export interface PurchaseExpiryJobData {
  purchaseId: string;
}

export const INVOICE_DUE_JOB = "invoice-due";
export const PURCHASE_EXPIRY_JOB = "purchase-expire";

/**
 * Agenda os jobs de cobrança (BullMQ/Redis) numa fila única com dois tipos. `jobId`
 * determinístico = idempotente. As transições disparadas são guardadas (só agem se
 * o estado ainda for o esperado), então é seguro rodar mesmo após pagamento/cancelamento.
 */
@Injectable()
export class BillingScheduler {
  constructor(@InjectQueue(BILLING_QUEUE) private readonly queue: Queue) {}

  async scheduleInvoiceDue(invoiceId: string, vencimentoEm: string): Promise<void> {
    await this.queue.add(
      INVOICE_DUE_JOB,
      { invoiceId } satisfies InvoiceDueJobData,
      {
        delay: Math.max(0, Date.parse(vencimentoEm) - Date.now()),
        jobId: `invoice:due:${invoiceId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  async schedulePurchaseExpiry(purchaseId: string, expiraEm: string): Promise<void> {
    await this.queue.add(
      PURCHASE_EXPIRY_JOB,
      { purchaseId } satisfies PurchaseExpiryJobData,
      {
        delay: Math.max(0, Date.parse(expiraEm) - Date.now()),
        jobId: `purchase:expire:${purchaseId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
