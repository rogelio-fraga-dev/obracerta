import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  createPurchaseSchema,
  createSubscriptionSchema,
  paymentMethodSchema,
  z,
  type CreatePurchaseInput,
  type CreateSubscriptionInput,
  type Invoice,
  type JwtClaims,
  type Purchase,
  type Subscription,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { BillingService, type WebhookResult } from "../application/billing.service.js";

/** Webhook do gateway (normalizado). Em prod é validado por assinatura, não JWT. */
const webhookSchema = z.object({
  eventId: z.string().trim().min(1).max(120),
  tipo: z.string().trim().min(1).max(60),
  chargeId: z.string().trim().min(1).max(64),
  metodo: paymentMethodSchema.optional(),
});
type WebhookBody = z.infer<typeof webhookSchema>;

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
