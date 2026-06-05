import { BadRequestException, ConflictException, Inject, Injectable, Logger } from "@nestjs/common";
import {
  InvoiceStatus,
  ProfessionalPlan,
  UserType,
  type CreatePurchaseInput,
  type CreateSubscriptionInput,
  type Invoice,
  type PaymentMethod,
  type Purchase,
  type Subscription,
} from "@obracerta/shared";
import { AuditService } from "../../audit/application/audit.service.js";
import { UsersService } from "../../users/application/users.service.js";
import {
  canTransitionInvoice,
  contractorPriceCentavos,
  graceUntil,
  isPaymentConfirmed,
  nextCharge,
  professionalPriceCentavos,
  purchaseExpiry,
} from "../domain/billing-rules.js";
import { PAYMENT_GATEWAY, type PaymentGateway } from "../domain/ports/payment-gateway.js";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepository,
} from "../domain/ports/subscription.repository.js";
import {
  PURCHASE_REPOSITORY,
  type PurchaseRepository,
} from "../domain/ports/purchase.repository.js";
import { INVOICE_REPOSITORY, type InvoiceRepository } from "../domain/ports/invoice.repository.js";
import {
  PAYMENT_EVENT_REPOSITORY,
  type PaymentEventRepository,
} from "../domain/ports/payment-event.repository.js";

/** Entrada de um webhook de pagamento já normalizada. */
export interface PaymentWebhookInput {
  eventId: string;
  tipo: string;
  chargeId: string;
  metodo?: PaymentMethod;
  payload?: unknown;
}

/** Resultado do processamento de um webhook (para log/observabilidade). */
export type WebhookResult =
  | "duplicado"
  | "ignorado"
  | "sem_fatura"
  | "ja_processada"
  | "pago";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    @Inject(PURCHASE_REPOSITORY) private readonly purchases: PurchaseRepository,
    @Inject(INVOICE_REPOSITORY) private readonly invoices: InvoiceRepository,
    @Inject(PAYMENT_EVENT_REPOSITORY) private readonly events: PaymentEventRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Profissional assina um plano recorrente: cria a assinatura no gateway, abre
   * a assinatura local (EM_GRACA por 7 dias) e emite a 1ª fatura (vence ao fim da graça).
   */
  async subscribe(userId: string, input: CreateSubscriptionInput): Promise<Subscription> {
    if (input.plano === ProfessionalPlan.INICIANTE) {
      throw new BadRequestException("O plano Iniciante é gratuito — não requer assinatura.");
    }
    const user = await this.users.findById(userId);
    if (!user || user.tipo !== UserType.PROFISSIONAL) {
      throw new BadRequestException("Apenas profissionais assinam planos recorrentes.");
    }
    if (await this.subscriptions.findActiveByUser(userId)) {
      throw new ConflictException("Você já tem uma assinatura vigente.");
    }

    const now = new Date();
    const valorCentavos = professionalPriceCentavos(input.plano);
    const venceEm = graceUntil(now).toISOString();

    const sub = await this.gateway.createSubscription({
      userId,
      plano: input.plano,
      valorCentavos,
      proximaCobranca: venceEm,
    });
    const subscription = await this.subscriptions.create({
      userId,
      plano: input.plano,
      gateway: this.gateway.name,
      gatewayId: sub.gatewayId,
      valorCentavos,
      graceUntil: venceEm,
      proximaCobranca: venceEm,
    });

    const charge = await this.gateway.createCharge({
      userId,
      valorCentavos,
      vencimento: venceEm,
      descricao: `Assinatura ${input.plano}`,
    });
    await this.invoices.create({
      userId,
      subscriptionId: subscription.id,
      purchaseId: null,
      gateway: this.gateway.name,
      gatewayId: charge.gatewayId,
      valorCentavos,
      vencimentoEm: venceEm,
    });

    await this.audit.record({
      atorUserId: userId,
      acao: "ASSINATURA_CRIADA",
      entidade: "subscription",
      entidadeId: subscription.id,
      dados: { plano: input.plano, valorCentavos },
    });
    return subscription;
  }

  /**
   * Contratante compra um plano avulso: cria a cobrança no gateway, abre a compra
   * (PENDENTE) e emite a fatura. Vigência só após o pagamento (webhook).
   */
  async purchase(userId: string, input: CreatePurchaseInput): Promise<Purchase> {
    const user = await this.users.findById(userId);
    if (!user || user.tipo !== UserType.CONTRATANTE) {
      throw new BadRequestException("Apenas contratantes compram planos avulsos.");
    }

    const now = new Date();
    const valorCentavos = contractorPriceCentavos(input.plano);
    const venceEm = nextCharge(now).toISOString(); // janela de pagamento do avulso

    const charge = await this.gateway.createCharge({
      userId,
      valorCentavos,
      vencimento: venceEm,
      descricao: `Plano avulso ${input.plano}`,
    });
    const purchase = await this.purchases.create({
      userId,
      plano: input.plano,
      gateway: this.gateway.name,
      gatewayId: charge.gatewayId,
      valorCentavos,
    });
    await this.invoices.create({
      userId,
      subscriptionId: null,
      purchaseId: purchase.id,
      gateway: this.gateway.name,
      gatewayId: charge.gatewayId,
      valorCentavos,
      vencimentoEm: venceEm,
    });

    await this.audit.record({
      atorUserId: userId,
      acao: "COMPRA_CRIADA",
      entidade: "purchase",
      entidadeId: purchase.id,
      dados: { plano: input.plano, valorCentavos },
    });
    return purchase;
  }

  /**
   * Processa um webhook de pagamento de forma IDEMPOTENTE: registra o evento (UNIQUE
   * gateway+eventId); se já visto, ignora. Em pagamento confirmado, marca a fatura
   * PAGA e ativa a origem (assinatura → ATIVA; compra → ATIVO + expiração).
   */
  async handleWebhook(input: PaymentWebhookInput): Promise<WebhookResult> {
    const novo = await this.events.record({
      gateway: this.gateway.name,
      eventId: input.eventId,
      tipo: input.tipo,
      payload: input.payload ?? input,
    });
    if (!novo) return "duplicado";
    if (!isPaymentConfirmed(input.tipo)) return "ignorado";

    const invoice = await this.invoices.findByGatewayCharge(this.gateway.name, input.chargeId);
    if (!invoice) {
      this.logger.warn(`Webhook sem fatura correspondente (charge ${input.chargeId}).`);
      return "sem_fatura";
    }
    if (!canTransitionInvoice(invoice.status, InvoiceStatus.PAGA)) return "ja_processada";

    await this.invoices.markPaid(invoice.id, input.metodo ?? null);
    await this.activateOrigin(invoice);

    await this.audit.record({
      atorUserId: null,
      acao: "PAGAMENTO_CONFIRMADO",
      entidade: "invoice",
      entidadeId: invoice.id,
      dados: { metodo: input.metodo ?? null, valorCentavos: invoice.valorCentavos },
    });
    return "pago";
  }

  listInvoices(userId: string): Promise<Invoice[]> {
    return this.invoices.listForUser(userId);
  }

  /** Ativa a origem da fatura paga: assinatura (ATIVA) ou compra (ATIVO + expiração). */
  private async activateOrigin(invoice: Invoice): Promise<void> {
    if (invoice.subscriptionId) {
      await this.subscriptions.activate(invoice.subscriptionId);
    } else if (invoice.purchaseId) {
      await this.purchases.activate(invoice.purchaseId, purchaseExpiry(new Date()).toISOString());
    }
  }
}
