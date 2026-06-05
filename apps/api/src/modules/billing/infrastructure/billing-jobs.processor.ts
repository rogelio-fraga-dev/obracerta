import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { BillingService } from "../application/billing.service.js";
import {
  BILLING_QUEUE,
  INVOICE_DUE_JOB,
  PURCHASE_EXPIRY_JOB,
  type InvoiceDueJobData,
  type PurchaseExpiryJobData,
} from "../application/billing.scheduler.js";

/**
 * Worker dos jobs de cobrança (fila única, dois tipos). Vencer fatura PENDENTE →
 * VENCIDA; expirar compra ATIVO → EXPIRADO. As transições são guardadas no service,
 * então rodar após pagamento/cancelamento é inofensivo (idempotente).
 */
@Processor(BILLING_QUEUE)
export class BillingJobsProcessor extends WorkerHost {
  private readonly logger = new Logger(BillingJobsProcessor.name);

  constructor(private readonly billing: BillingService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === INVOICE_DUE_JOB) {
      const { invoiceId } = job.data as InvoiceDueJobData;
      if (await this.billing.expireInvoiceIfPending(invoiceId)) {
        this.logger.log(`Fatura ${invoiceId} vencida (sem pagamento até o vencimento).`);
      }
      return;
    }
    if (job.name === PURCHASE_EXPIRY_JOB) {
      const { purchaseId } = job.data as PurchaseExpiryJobData;
      if (await this.billing.expirePurchaseIfActive(purchaseId)) {
        this.logger.log(`Compra avulsa ${purchaseId} expirada (fim da vigência).`);
      }
      return;
    }
  }
}
