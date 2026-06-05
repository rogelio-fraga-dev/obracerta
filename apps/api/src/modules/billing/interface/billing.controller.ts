import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createPurchaseSchema,
  createSubscriptionSchema,
  paymentMethodSchema,
  uuidSchema,
  z,
  type CreatePurchaseInput,
  type CreateSubscriptionInput,
  type Invoice,
  type JwtClaims,
  type Purchase,
  type Refund,
  type Subscription,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { RefundReason } from "../domain/refund-rules.js";
import {
  BillingService,
  type EntitlementsView,
  type WebhookResult,
} from "../application/billing.service.js";

/** Webhook do gateway (normalizado). Em prod é validado por assinatura, não JWT. */
const webhookSchema = z.object({
  eventId: z.string().trim().min(1).max(120),
  tipo: z.string().trim().min(1).max(60),
  chargeId: z.string().trim().min(1).max(64),
  metodo: paymentMethodSchema.optional(),
});
type WebhookBody = z.infer<typeof webhookSchema>;

/** Solicitação de reembolso: fatura + motivo CDC. */
const requestRefundSchema = z.object({
  invoiceId: uuidSchema,
  motivo: z.nativeEnum(RefundReason),
});
type RequestRefundBody = z.infer<typeof requestRefundSchema>;

/** Decisão sobre um reembolso (ação de financeiro/moderador). */
const resolveRefundSchema = z.object({ aprovar: z.boolean() });

/**
 * Billing (roadmap §7.1, Etapa 4.1). As rotas do usuário exigem JWT; o webhook do
 * gateway NÃO (gateways não são usuários autenticados — em prod, validado por
 * assinatura HMAC, hardening da etapa 4.2).
 */
@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** Profissional assina um plano recorrente. */
  @Post("subscriptions")
  @UseGuards(JwtAuthGuard)
  subscribe(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createSubscriptionSchema)) input: CreateSubscriptionInput,
  ): Promise<Subscription> {
    return this.billing.subscribe(user.sub, input);
  }

  /** Contratante compra um plano avulso. */
  @Post("purchases")
  @UseGuards(JwtAuthGuard)
  purchase(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createPurchaseSchema)) input: CreatePurchaseInput,
  ): Promise<Purchase> {
    return this.billing.purchase(user.sub, input);
  }

  /** Faturas do usuário autenticado. */
  @Get("invoices/me")
  @UseGuards(JwtAuthGuard)
  myInvoices(@CurrentUser() user: JwtClaims): Promise<Invoice[]> {
    return this.billing.listInvoices(user.sub);
  }

  /** Plano vigente + features liberadas do usuário autenticado (gating). */
  @Get("me/entitlements")
  @UseGuards(JwtAuthGuard)
  myEntitlements(@CurrentUser() user: JwtClaims): Promise<EntitlementsView> {
    return this.billing.getEntitlements(user.sub);
  }

  /** Solicita reembolso de uma fatura paga (motivo CDC). */
  @Post("refunds")
  @UseGuards(JwtAuthGuard)
  requestRefund(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(requestRefundSchema)) body: RequestRefundBody,
  ): Promise<Refund> {
    return this.billing.requestRefund(user.sub, body.invoiceId, body.motivo);
  }

  /** Reembolsos do usuário autenticado. */
  @Get("refunds/me")
  @UseGuards(JwtAuthGuard)
  myRefunds(@CurrentUser() user: JwtClaims): Promise<Refund[]> {
    return this.billing.listRefunds(user.sub);
  }

  /** Resolve um reembolso (financeiro/moderador — gating por papel na Fase 6). */
  @Post("refunds/:id/resolve")
  @UseGuards(JwtAuthGuard)
  resolveRefund(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(resolveRefundSchema)) body: { aprovar: boolean },
  ): Promise<Refund> {
    return this.billing.resolveRefund(id, body.aprovar);
  }

  /** Webhook de pagamento do gateway (idempotente; sem JWT). */
  @Post("billing/webhook")
  async webhook(
    @Body(new ZodValidationPipe(webhookSchema)) body: WebhookBody,
  ): Promise<{ status: WebhookResult }> {
    const status = await this.billing.handleWebhook({
      eventId: body.eventId,
      tipo: body.tipo,
      chargeId: body.chargeId,
      metodo: body.metodo,
    });
    return { status };
  }
}
