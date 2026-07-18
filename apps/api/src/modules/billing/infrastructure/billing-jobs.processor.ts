import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { BillingService } from "../application/billing.service.js";
import {
  BILLING_QUEUE,
  INVOICE_DUE_JOB,
  PURCHASE_EXPIRY_JOB,
  PURCHASE_RENEW_JOB,
  SUBSCRIPTION_RENEW_JOB,
  PLAN_REMINDER_JOB,
  type InvoiceDueJobData,
  type PurchaseExpiryJobData,
  type PurchaseRenewJobData,
  type SubscriptionRenewJobData,
  type PlanReminderJobData,
} from "../application/billing.scheduler.js";

/**
 * Worker dos jobs de cobrança (fila única, vários tipos). Vencer fatura, expirar
 * compra, **renovar assinatura** (gera a próxima fatura) e **lembrar do plano**. As
 * transições são guardadas no service, então rodar após pagamento/cancelamento é
 * inofensivo (idempotente).
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
        this.logger.log(`Plano de acesso ${purchaseId} expirado (fim da vigência).`);
      }
      return;
    }
    if (job.name === PURCHASE_RENEW_JOB) {
      const { purchaseId } = job.data as PurchaseRenewJobData;
      if (await this.billing.renewPurchaseIfDue(purchaseId)) {
        this.logger.log(`Plano de acesso ${purchaseId} renovado (fatura do próximo ciclo emitida).`);
      }
      return;
    }
    if (job.name === SUBSCRIPTION_RENEW_JOB) {
      const { subscriptionId } = job.data as SubscriptionRenewJobData;
      if (await this.billing.renewSubscriptionIfDue(subscriptionId)) {
        this.logger.log(`Assinatura ${subscriptionId} renovada (nova fatura emitida).`);
      }
      return;
    }
    if (job.name === PLAN_REMINDER_JOB) {
      const { subscriptionId } = job.data as PlanReminderJobData;
      await this.billing.remindPlanIfActive(subscriptionId);
      return;
    }
  }
}
