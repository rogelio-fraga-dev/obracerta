import {
  ContractorPlan,
  InvoiceStatus,
  ProfessionalPlan,
  SubscriptionStatus,
} from "@obracerta/shared";

/**
 * Domínio puro do billing (roadmap §7.1/§19). Sem framework/ORM: preços por plano
 * (em centavos), janelas de cobrança, máquina de estados da fatura e reconhecimento
 * dos eventos de pagamento do gateway.
 */

/** "7 dias de graça" da assinatura (nunca "trial"). */
export const SUBSCRIPTION_GRACE_DAYS = 7;
/** Período de recorrência da assinatura (mensal). */
export const BILLING_PERIOD_DAYS = 30;
/** Validade do plano avulso do contratante. */
export const PURCHASE_VALIDITY_DAYS = 30;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Preço mensal do plano do profissional, em centavos (INICIANTE é grátis). */
export function professionalPriceCentavos(plan: ProfessionalPlan): number {
  switch (plan) {
    case ProfessionalPlan.PRO:
      return 4900;
    case ProfessionalPlan.ESPECIALISTA:
      return 9900;
    case ProfessionalPlan.INICIANTE:
    default:
      return 0;
  }
}

/** Preço do plano avulso do contratante, em centavos. */
export function contractorPriceCentavos(plan: ContractorPlan): number {
  switch (plan) {
    case ContractorPlan.BASICO:
      return 1900;
    case ContractorPlan.COMPLETO:
      return 3900;
    case ContractorPlan.LANCE:
      return 6900;
    default:
      return 0;
  }
}

const addDays = (now: Date, dias: number): Date => new Date(now.getTime() + dias * MS_POR_DIA);

/** Fim da graça: agora + 7 dias (1ª cobrança vence aqui). */
export function graceUntil(now: Date): Date {
  return addDays(now, SUBSCRIPTION_GRACE_DAYS);
}

/** Próxima cobrança recorrente: agora + 30 dias. */
export function nextCharge(now: Date): Date {
  return addDays(now, BILLING_PERIOD_DAYS);
}

/** Expiração do plano avulso: agora + 30 dias. */
export function purchaseExpiry(now: Date): Date {
  return addDays(now, PURCHASE_VALIDITY_DAYS);
}

/** Transições válidas da fatura (máquina de estados). */
const INVOICE_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  [InvoiceStatus.PENDENTE]: [InvoiceStatus.PAGA, InvoiceStatus.VENCIDA, InvoiceStatus.CANCELADA],
  [InvoiceStatus.VENCIDA]: [InvoiceStatus.PAGA, InvoiceStatus.CANCELADA],
  [InvoiceStatus.PAGA]: [InvoiceStatus.ESTORNADA],
  [InvoiceStatus.CANCELADA]: [],
  [InvoiceStatus.ESTORNADA]: [],
};

/** A fatura pode ir de `from` para `to`? */
export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return INVOICE_TRANSITIONS[from].includes(to);
}

/** Tipos de evento do gateway que confirmam pagamento. */
const PAID_EVENT_TYPES: ReadonlySet<string> = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);

/** O evento de webhook confirma um pagamento? */
export function isPaymentConfirmed(tipo: string): boolean {
  return PAID_EVENT_TYPES.has(tipo);
}

/** Dias antes da próxima cobrança em que o lembrete de plano é enviado. */
export const PLAN_REMINDER_DAYS_BEFORE = 3;

/** A assinatura ainda renova? (em graça ou ativa; encerradas/inadimplentes não). */
export function canRenew(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.EM_GRACA || status === SubscriptionStatus.ATIVA;
}

/** Quando lembrar o usuário da cobrança: alguns dias antes da próxima cobrança. */
export function planReminderDate(proximaCobranca: Date): Date {
  return new Date(proximaCobranca.getTime() - PLAN_REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000);
}
