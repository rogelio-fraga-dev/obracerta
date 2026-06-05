import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { EntitlementsModule } from "../entitlements/entitlements.module.js";
import { UsersModule } from "../users/users.module.js";
import { BillingScheduler, BILLING_QUEUE } from "./application/billing.scheduler.js";
import { BillingService } from "./application/billing.service.js";
import { PAYMENT_GATEWAY } from "./domain/ports/payment-gateway.js";
import { SUBSCRIPTION_REPOSITORY } from "./domain/ports/subscription.repository.js";
import { PURCHASE_REPOSITORY } from "./domain/ports/purchase.repository.js";
import { INVOICE_REPOSITORY } from "./domain/ports/invoice.repository.js";
import { REFUND_REPOSITORY } from "./domain/ports/refund.repository.js";
import { PAYMENT_EVENT_REPOSITORY } from "./domain/ports/payment-event.repository.js";
import { FakePaymentGateway } from "./infrastructure/fake-payment-gateway.js";
import { DrizzleSubscriptionRepository } from "./infrastructure/drizzle-subscription.repository.js";
import { DrizzlePurchaseRepository } from "./infrastructure/drizzle-purchase.repository.js";
import { DrizzleInvoiceRepository } from "./infrastructure/drizzle-invoice.repository.js";
import { DrizzleRefundRepository } from "./infrastructure/drizzle-refund.repository.js";
import { DrizzlePaymentEventRepository } from "./infrastructure/drizzle-payment-event.repository.js";
import { BillingJobsProcessor } from "./infrastructure/billing-jobs.processor.js";
import { BillingController } from "./interface/billing.controller.js";

/**
 * Billing (roadmap §7.1, Etapa 4.1). Assinatura recorrente + compra avulsa atrás
 * da porta PaymentGateway (dev: adapter fake; prod: Asaas). Webhooks idempotentes
 * via payment_events. Importa UsersModule (valida tipo) e AuditModule (trilha).
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    AuditModule,
    EntitlementsModule,
    BullModule.registerQueue({ name: BILLING_QUEUE }),
  ],
  controllers: [BillingController],
  providers: [
    BillingService,
    BillingScheduler,
    BillingJobsProcessor,
    { provide: PAYMENT_GATEWAY, useClass: FakePaymentGateway },
    { provide: SUBSCRIPTION_REPOSITORY, useClass: DrizzleSubscriptionRepository },
    { provide: PURCHASE_REPOSITORY, useClass: DrizzlePurchaseRepository },
    { provide: INVOICE_REPOSITORY, useClass: DrizzleInvoiceRepository },
    { provide: REFUND_REPOSITORY, useClass: DrizzleRefundRepository },
    { provide: PAYMENT_EVENT_REPOSITORY, useClass: DrizzlePaymentEventRepository },
  ],
  exports: [BillingService],
})
export class BillingModule {}
