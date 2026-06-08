import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  InvoiceStatus,
  ProfessionalPlan,
  RefundStatus,
  SubscriptionStatus,
  UserType,
  type CreatePurchaseInput,
  type CreateSubscriptionInput,
  type Invoice,
  type PaymentMethod,
  type Purchase,
  type Refund,
  type Subscription,
} from "@obracerta/shared";
import { AuditService } from "../../audit/application/audit.service.js";
import { EntitlementsService } from "../../entitlements/application/entitlements.service.js";
import type { Feature, Plan } from "../../entitlements/domain/entitlements.js";
import { UsersService } from "../../users/application/users.service.js";
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
} from "../../notifications/domain/notification.provider.js";
import {
  canRenew,
  canTransitionInvoice,
  contractorPriceCentavos,
  graceUntil,
  isPaymentConfirmed,
  nextCharge,
  planReminderDate,
  professionalPriceCentavos,
  purchaseExpiry,
} from "../domain/billing-rules.js";
import { canRefundInvoice, computeRefundCentavos, type RefundReason } from "../domain/refund-rules.js";
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
import { REFUND_REPOSITORY, type RefundRepository } from "../domain/ports/refund.repository.js";
import {
  PAYMENT_EVENT_REPOSITORY,
  type PaymentEventRepository,
} from "../domain/ports/payment-event.repository.js";
import { BillingScheduler } from "./billing.scheduler.js";

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

/** Plano vigente do usuário + features liberadas (gating §3/§17). */
export interface EntitlementsView {
  plano: Plan | null;
  features: Feature[];
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: SubscriptionRepository,
    @Inject(PURCHASE_REPOSITORY) private readonly purchases: PurchaseRepository,
    @Inject(INVOICE_REPOSITORY) private readonly invoices: InvoiceRepository,
    @Inject(REFUND_REPOSITORY) private readonly refunds: RefundRepository,
    @Inject(PAYMENT_EVENT_REPOSITORY) private readonly events: PaymentEventRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly scheduler: BillingScheduler,
    private readonly entitlements: EntitlementsService,
    private readonly users: UsersService,
    private readonly audit: AuditService,
    @Inject(NOTIFICATION_PROVIDER) private readonly notifications: NotificationProvider,
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
    const invoice = await this.invoices.create({
      userId,
      subscriptionId: subscription.id,
      purchaseId: null,
      gateway: this.gateway.name,
      gatewayId: charge.gatewayId,
      valorCentavos,
      vencimentoEm: venceEm,
    });
    await this.scheduler.scheduleInvoiceDue(invoice.id, venceEm);

    // a 1ª fatura é o 1º ciclo; a renovação recorrente começa no ciclo seguinte
    const renovaEm = nextCharge(graceUntil(now)).toISOString();
    await this.scheduler.scheduleSubscriptionRenewal(subscription.id, renovaEm);
    await this.scheduler.schedulePlanReminder(
      subscription.id,
      planReminderDate(new Date(renovaEm)).toISOString(),
    );

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
   * Renovação recorrente (job na próxima cobrança): se a assinatura ainda vale,
   * emite a próxima fatura, avança a próxima cobrança (+30d) e reagenda o ciclo.
   * O pagamento é confirmado pelo webhook (4.1); não pago → fatura VENCIDA (job).
   */
  async renewSubscriptionIfDue(subscriptionId: string): Promise<boolean> {
    const sub = await this.subscriptions.findById(subscriptionId);
    if (!sub || !canRenew(sub.status)) return false;

    const now = new Date();
    const venceEm = graceUntil(now).toISOString();
    const charge = await this.gateway.createCharge({
      userId: sub.userId,
      valorCentavos: sub.valorCentavos,
      vencimento: venceEm,
      descricao: `Renovação ${sub.plano}`,
    });
    const invoice = await this.invoices.create({
      userId: sub.userId,
      subscriptionId: sub.id,
      purchaseId: null,
      gateway: this.gateway.name,
      gatewayId: charge.gatewayId,
      valorCentavos: sub.valorCentavos,
      vencimentoEm: venceEm,
    });
    await this.scheduler.scheduleInvoiceDue(invoice.id, venceEm);

    const renovaEm = nextCharge(now).toISOString();
    await this.subscriptions.setProximaCobranca(sub.id, renovaEm);
    await this.scheduler.scheduleSubscriptionRenewal(sub.id, renovaEm);
    await this.scheduler.schedulePlanReminder(
      sub.id,
      planReminderDate(new Date(renovaEm)).toISOString(),
    );

    await this.audit.record({
      atorUserId: null,
      acao: "ASSINATURA_RENOVADA",
      entidade: "subscription",
      entidadeId: sub.id,
      dados: { invoiceId: invoice.id, valorCentavos: sub.valorCentavos },
    });
    return true;
  }

  /** Lembrete de plano (job antes da cobrança): notifica se a assinatura ainda vale. */
  async remindPlanIfActive(subscriptionId: string): Promise<boolean> {
    const sub = await this.subscriptions.findById(subscriptionId);
    if (!sub || !canRenew(sub.status)) return false;
    const user = await this.users.findById(sub.userId);
    if (!user) return false;
    await this.notifications.sendMessage(
      user.whatsapp,
      `Sua assinatura ${sub.plano} renova em breve. Garanta que seu pagamento está em dia.`,
    );
    return true;
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
    const invoice = await this.invoices.create({
      userId,
      subscriptionId: null,
      purchaseId: purchase.id,
      gateway: this.gateway.name,
      gatewayId: charge.gatewayId,
      valorCentavos,
      vencimentoEm: venceEm,
    });
    await this.scheduler.scheduleInvoiceDue(invoice.id, venceEm);

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

  listRefunds(userId: string): Promise<Refund[]> {
    return this.refunds.listForUser(userId);
  }

  /** Fila do financeiro: reembolsos SOLICITADO aguardando decisão. */
  listPendingRefunds(): Promise<Refund[]> {
    return this.refunds.listPending();
  }

  /**
   * Solicita reembolso de uma fatura PAGA do usuário (roadmap §21). O valor é
   * calculado pelo motivo CDC (integral/proporcional); 0 → não elegível.
   */
  async requestRefund(userId: string, invoiceId: string, reason: RefundReason): Promise<Refund> {
    const invoice = await this.invoices.findById(invoiceId);
    if (!invoice) throw new NotFoundException("Fatura não encontrada.");
    if (invoice.userId !== userId) throw new ForbiddenException("Esta fatura não é sua.");
    if (!canRefundInvoice(invoice.status) || !invoice.pagoEm) {
      throw new ConflictException("Só faturas pagas podem ser estornadas.");
    }

    const { inicio, fim } = await this.vigencia(invoice);
    const valorCentavos = computeRefundCentavos({
      reason,
      valorPagoCentavos: invoice.valorCentavos,
      pagoEm: new Date(invoice.pagoEm),
      now: new Date(),
      vigenciaInicio: inicio,
      vigenciaFim: fim,
    });
    if (valorCentavos <= 0) {
      throw new BadRequestException("Esta fatura não é elegível a reembolso por esse motivo.");
    }

    const refund = await this.refunds.create({ invoiceId, userId, valorCentavos, motivo: reason });
    await this.audit.record({
      atorUserId: userId,
      acao: "REEMBOLSO_SOLICITADO",
      entidade: "refund",
      entidadeId: refund.id,
      dados: { invoiceId, motivo: reason, valorCentavos },
    });
    return refund;
  }

  /**
   * A moderação/financeiro resolve o reembolso. Aprovado: estorna no gateway, marca
   * a fatura ESTORNADA e revoga o acesso (compra → EXPIRADO; assinatura → CANCELADA).
   */
  async resolveRefund(refundId: string, aprovar: boolean): Promise<Refund> {
    const refund = await this.refunds.findById(refundId);
    if (!refund) throw new NotFoundException("Reembolso não encontrado.");
    if (refund.status !== RefundStatus.SOLICITADO) {
      throw new ConflictException("Este reembolso já foi resolvido.");
    }

    if (!aprovar) {
      const recusado = await this.refunds.resolve(refundId, RefundStatus.RECUSADO, null);
      await this.audit.record({
        atorUserId: null,
        acao: "REEMBOLSO_RECUSADO",
        entidade: "refund",
        entidadeId: refundId,
        dados: null,
      });
      return recusado ?? refund;
    }

    const invoice = await this.invoices.findById(refund.invoiceId);
    if (!invoice?.gatewayId) throw new NotFoundException("Fatura do reembolso não encontrada.");

    const ref = await this.gateway.refund({
      chargeId: invoice.gatewayId,
      valorCentavos: refund.valorCentavos,
    });
    await this.invoices.transition(invoice.id, InvoiceStatus.PAGA, InvoiceStatus.ESTORNADA);
    if (invoice.purchaseId) await this.purchases.expire(invoice.purchaseId);
    else if (invoice.subscriptionId) await this.subscriptions.cancel(invoice.subscriptionId);

    const concluido = await this.refunds.resolve(refundId, RefundStatus.CONCLUIDO, ref.gatewayId);
    await this.audit.record({
      atorUserId: null,
      acao: "REEMBOLSO_CONCLUIDO",
      entidade: "refund",
      entidadeId: refundId,
      dados: { valorCentavos: refund.valorCentavos, gatewayId: ref.gatewayId },
    });
    return concluido ?? refund;
  }

  /** Job: vence a fatura se ainda PENDENTE (transição guardada). */
  async expireInvoiceIfPending(invoiceId: string): Promise<boolean> {
    const updated = await this.invoices.transition(
      invoiceId,
      InvoiceStatus.PENDENTE,
      InvoiceStatus.VENCIDA,
    );
    return updated !== null;
  }

  /** Job: expira a compra avulsa se ainda ATIVO (transição guardada). */
  async expirePurchaseIfActive(purchaseId: string): Promise<boolean> {
    const updated = await this.purchases.expire(purchaseId);
    return updated !== null;
  }

  /** Plano vigente do usuário + features liberadas (assinatura EM_GRACA/ATIVA ou avulso vigente). */
  async getEntitlements(userId: string): Promise<EntitlementsView> {
    const plano = await this.activePlan(userId);
    return { plano, features: [...this.entitlements.featuresFor(plano)] };
  }

  /** Ativa a origem da fatura paga: assinatura (ATIVA) ou compra (ATIVO + expiração). */
  private async activateOrigin(invoice: Invoice): Promise<void> {
    if (invoice.subscriptionId) {
      await this.subscriptions.activate(invoice.subscriptionId);
    } else if (invoice.purchaseId) {
      const expiraEm = purchaseExpiry(new Date()).toISOString();
      await this.purchases.activate(invoice.purchaseId, expiraEm);
      await this.scheduler.schedulePurchaseExpiry(invoice.purchaseId, expiraEm);
    }
  }

  /** Janela de vigência da fatura (para o reembolso proporcional). */
  private async vigencia(invoice: Invoice): Promise<{ inicio: Date | null; fim: Date | null }> {
    const inicio = invoice.pagoEm ? new Date(invoice.pagoEm) : null;
    if (invoice.subscriptionId) {
      const sub = await this.subscriptions.findById(invoice.subscriptionId);
      return { inicio, fim: sub?.proximaCobranca ? new Date(sub.proximaCobranca) : null };
    }
    if (invoice.purchaseId) {
      const purchase = await this.purchases.findById(invoice.purchaseId);
      return { inicio, fim: purchase?.expiraEm ? new Date(purchase.expiraEm) : null };
    }
    return { inicio, fim: null };
  }

  /** Plano efetivamente vigente do usuário (ou null). */
  private async activePlan(userId: string): Promise<Plan | null> {
    const sub = await this.subscriptions.findActiveByUser(userId);
    if (
      sub &&
      (sub.status === SubscriptionStatus.EM_GRACA || sub.status === SubscriptionStatus.ATIVA)
    ) {
      return sub.plano;
    }
    const purchase = await this.purchases.findActiveByUser(userId);
    if (purchase?.expiraEm && new Date(purchase.expiraEm).getTime() > Date.now()) {
      return purchase.plano;
    }
    return null;
  }
}
