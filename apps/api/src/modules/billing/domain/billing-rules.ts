import {
  ContractorPlan,
  InvoiceStatus,
  ProfessionalPlan,
  SubscriptionStatus,
  UserType,
} from "@obracerta/shared";

/**
 * Domínio puro do billing (roadmap §7.1/§19). Sem framework/ORM: preços por plano
 * (em centavos), janelas de cobrança, máquina de estados da fatura e reconhecimento
 * dos eventos de pagamento do gateway.
 *
 * Homologação 18/07: todos os planos são pagos. O **teste grátis de 7 dias é
 * exclusivo do Iniciante** (cartão obrigatório; 1ª cobrança só após o teste);
 * os demais planos têm janela curta de pagamento da 1ª fatura. Contratante e
 * empresa assinam mensalmente (renovação automática, cancele quando quiser).
 */

/** Dias de teste grátis do plano Iniciante (cartão obrigatório). */
export const TRIAL_DAYS = 7;
/** Janela de pagamento da 1ª fatura dos planos sem teste grátis. */
export const FIRST_PAYMENT_WINDOW_DAYS = 3;
/** Compat: janela histórica de "7 dias de graça" da assinatura. */
export const SUBSCRIPTION_GRACE_DAYS = TRIAL_DAYS;
/** Período de recorrência da assinatura (mensal). */
export const BILLING_PERIOD_DAYS = 30;
/** Vigência de cada ciclo do plano de contratante/empresa. */
export const PURCHASE_VALIDITY_DAYS = 30;
/** Dias antes do fim da vigência em que a fatura de renovação do acesso é emitida. */
export const PURCHASE_RENEWAL_LEAD_DAYS = 3;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Preço mensal do plano do profissional, em centavos (homologação 18/07). */
export function professionalPriceCentavos(plan: ProfessionalPlan): number {
  switch (plan) {
    case ProfessionalPlan.PRO:
      return 4990;
    case ProfessionalPlan.ESPECIALISTA:
      return 9990;
    case ProfessionalPlan.INICIANTE:
    default:
      return 1990;
  }
}

/**
 * Preço mensal do plano de acesso de quem contrata, em centavos. A EMPRESA paga
 * a tabela própria (Essencial R$ 49,90 · Completo R$ 99,90 · Empresa PRO R$ 149,90);
 * contratante pessoa física paga a tabela padrão.
 */
export function contractorPriceCentavos(plan: ContractorPlan, tipo?: UserType): number {
  if (tipo === UserType.EMPRESA) {
    switch (plan) {
      case ContractorPlan.BASICO:
        return 4990;
      case ContractorPlan.COMPLETO:
        return 9990;
      case ContractorPlan.LANCE:
        return 14990;
      default:
        return 0;
    }
  }
  switch (plan) {
    case ContractorPlan.BASICO:
      return 1990;
    case ContractorPlan.COMPLETO:
      return 3990;
    case ContractorPlan.LANCE:
      return 6990;
    default:
      return 0;
  }
}

/** O plano do profissional tem teste grátis? (exclusivo do Iniciante). */
export function hasTrial(plan: ProfessionalPlan): boolean {
  return plan === ProfessionalPlan.INICIANTE;
}

const addDays = (now: Date, dias: number): Date => new Date(now.getTime() + dias * MS_POR_DIA);

/** Fim do teste grátis: agora + 7 dias (1ª cobrança vence aqui). */
export function graceUntil(now: Date): Date {
  return addDays(now, TRIAL_DAYS);
}

/**
 * Vencimento da 1ª fatura da assinatura: fim do teste grátis (Iniciante) ou
 * janela curta de pagamento (demais planos — o acesso já começa, a fatura vence logo).
 */
export function firstInvoiceDue(plan: ProfessionalPlan, now: Date): Date {
  return hasTrial(plan) ? graceUntil(now) : addDays(now, FIRST_PAYMENT_WINDOW_DAYS);
}

/** Próxima cobrança recorrente: agora + 30 dias. */
export function nextCharge(now: Date): Date {
  return addDays(now, BILLING_PERIOD_DAYS);
}

/** Expiração do ciclo do plano de acesso: agora + 30 dias. */
export function purchaseExpiry(now: Date): Date {
  return addDays(now, PURCHASE_VALIDITY_DAYS);
}

/**
 * Expiração do próximo ciclo na renovação: +30 dias a partir do fim da vigência
 * atual (se ainda vigente) ou do pagamento — renovar antes do fim não come dias já pagos.
 */
export function renewedPurchaseExpiry(expiraEmAtual: Date | null, now: Date): Date {
  const base = expiraEmAtual && expiraEmAtual.getTime() > now.getTime() ? expiraEmAtual : now;
  return addDays(base, PURCHASE_VALIDITY_DAYS);
}

/** Quando emitir a fatura de renovação do acesso: alguns dias antes do fim da vigência. */
export function purchaseRenewalDate(expiraEm: Date): Date {
  return new Date(expiraEm.getTime() - PURCHASE_RENEWAL_LEAD_DAYS * MS_POR_DIA);
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
