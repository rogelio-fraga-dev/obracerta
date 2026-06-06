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
/** Job: renovar a assinatura (gerar a próxima fatura) na próxima cobrança. */
export interface SubscriptionRenewJobData {
  subscriptionId: string;
}
/** Job: lembrar o usuário da cobrança que vem aí. */
export interface PlanReminderJobData {
  subscriptionId: string;
}

export const INVOICE_DUE_JOB = "invoice-due";
export const PURCHASE_EXPIRY_JOB = "purchase-expire";
export const SUBSCRIPTION_RENEW_JOB = "subscription-renew";
export const PLAN_REMINDER_JOB = "plan-reminder";

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

  async scheduleSubscriptionRenewal(subscriptionId: string, proximaCobranca: string): Promise<void> {
    await this.queue.add(
      SUBSCRIPTION_RENEW_JOB,
      { subscriptionId } satisfies SubscriptionRenewJobData,
      {
        delay: Math.max(0, Date.parse(proximaCobranca) - Date.now()),
        // sem `:date` no jobId: cada ciclo reagenda; manter id estável evita acúmulo
        jobId: `subscription:renew:${subscriptionId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  async schedulePlanReminder(subscriptionId: string, lembrarEm: string): Promise<void> {
    await this.queue.add(
      PLAN_REMINDER_JOB,
      { subscriptionId } satisfies PlanReminderJobData,
      {
        delay: Math.max(0, Date.parse(lembrarEm) - Date.now()),
        jobId: `subscription:remind:${subscriptionId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
