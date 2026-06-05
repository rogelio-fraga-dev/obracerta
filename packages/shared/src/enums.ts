import { z } from "zod";

/**
 * Domain enums derived from the data model (plan §4).
 * Defined once and shared so frontend dropdowns and backend validation never drift.
 *
 * Each domain enum intentionally exports a `const` object and a `type` under the
 * same name (different declaration spaces, so no collision). This gives both a
 * runtime value (`UserType.PROFISSIONAL`) and a static type (`UserType`) — the
 * idiomatic Zod `nativeEnum` companion pattern.
 */

/** Tipo de usuário. */
export const UserType = {
  PROFISSIONAL: "PROFISSIONAL",
  CONTRATANTE: "CONTRATANTE",
} as const;
export const userTypeSchema = z.nativeEnum(UserType);
export type UserType = z.infer<typeof userTypeSchema>;

/** Status da conta. */
export const UserStatus = {
  ATIVO: "ATIVO",
  SUSPENSO: "SUSPENSO",
  REMOVIDO: "REMOVIDO",
} as const;
export const userStatusSchema = z.nativeEnum(UserStatus);
export type UserStatus = z.infer<typeof userStatusSchema>;

/** Estados do pedido de agendamento (plan §4.2). */
export const BookingStatus = {
  PENDENTE: "PENDENTE",
  APROVADO: "APROVADO",
  RECUSADO: "RECUSADO",
  EXPIRADO: "EXPIRADO",
  INICIADO: "INICIADO",
  CONCLUIDO: "CONCLUIDO",
  CANCELADO: "CANCELADO",
} as const;
export const bookingStatusSchema = z.nativeEnum(BookingStatus);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

/**
 * Motivos de recusa de um pedido (roadmap §8). Os "válidos" não geram penalidade;
 * `DESISTENCIA` (recusa sem justificativa legítima) é penalizável. A classificação
 * e a escala vivem no domínio `decline-penalty` da API.
 */
export const DeclineReason = {
  AGENDA_INDISPONIVEL: "AGENDA_INDISPONIVEL",
  FORA_DA_AREA: "FORA_DA_AREA",
  ESCOPO_INCOMPATIVEL: "ESCOPO_INCOMPATIVEL",
  VALOR_INCOMPATIVEL: "VALOR_INCOMPATIVEL",
  DESISTENCIA: "DESISTENCIA",
  OUTRO: "OUTRO",
} as const;
export const declineReasonSchema = z.nativeEnum(DeclineReason);
export type DeclineReason = z.infer<typeof declineReasonSchema>;

/** Plano do contratante (avulso). */
export const ContractorPlan = {
  BASICO: "BASICO",
  COMPLETO: "COMPLETO",
  LANCE: "LANCE",
} as const;
export const contractorPlanSchema = z.nativeEnum(ContractorPlan);
export type ContractorPlan = z.infer<typeof contractorPlanSchema>;

/** Plano do profissional (recorrência). */
export const ProfessionalPlan = {
  INICIANTE: "INICIANTE",
  PRO: "PRO",
  ESPECIALISTA: "ESPECIALISTA",
} as const;
export const professionalPlanSchema = z.nativeEnum(ProfessionalPlan);
export type ProfessionalPlan = z.infer<typeof professionalPlanSchema>;

/** Urgência da obra (plan §4.4). */
export const WorkUrgency = {
  URGENTE: "URGENTE",
  NORMAL: "NORMAL",
  FLEXIVEL: "FLEXIVEL",
} as const;
export const workUrgencySchema = z.nativeEnum(WorkUrgency);
export type WorkUrgency = z.infer<typeof workUrgencySchema>;

/**
 * Visibilidade de uma avaliação dupla-cega (roadmap §4.3/§12). PENDENTE enquanto
 * a contraparte não avalia e a janela de 7d não fecha; REVELADA quando ambas as
 * avaliações saem juntas (revelação simultânea) ou a janela expira; OCULTA quando
 * a moderação esconde após denúncia procedente.
 */
export const ReviewStatus = {
  PENDENTE: "PENDENTE",
  REVELADA: "REVELADA",
  OCULTA: "OCULTA",
} as const;
export const reviewStatusSchema = z.nativeEnum(ReviewStatus);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

/** Estados de uma denúncia de moderação (roadmap §13). */
export const ReportStatus = {
  ABERTA: "ABERTA",
  EM_ANALISE: "EM_ANALISE",
  PROCEDENTE: "PROCEDENTE",
  IMPROCEDENTE: "IMPROCEDENTE",
} as const;
export const reportStatusSchema = z.nativeEnum(ReportStatus);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

/** Estados de uma suspensão de conta com direito de apelação (roadmap §13). */
export const SuspensionStatus = {
  ATIVA: "ATIVA",
  APELADA: "APELADA",
  REVOGADA: "REVOGADA",
  EXPIRADA: "EXPIRADA",
} as const;
export const suspensionStatusSchema = z.nativeEnum(SuspensionStatus);
export type SuspensionStatus = z.infer<typeof suspensionStatusSchema>;

/**
 * Estados da assinatura recorrente do profissional (roadmap §7.1/§19). EM_GRACA =
 * "7 dias de graça" (nunca "trial"); INADIMPLENTE = cobrança falhou e aguarda
 * regularização antes de bloquear/cancelar.
 */
export const SubscriptionStatus = {
  EM_GRACA: "EM_GRACA",
  ATIVA: "ATIVA",
  INADIMPLENTE: "INADIMPLENTE",
  CANCELADA: "CANCELADA",
} as const;
export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

/** Estados da compra avulsa do contratante (sem recorrência, roadmap §7.1/§19). */
export const PurchaseStatus = {
  PENDENTE: "PENDENTE",
  ATIVO: "ATIVO",
  EXPIRADO: "EXPIRADO",
  CANCELADO: "CANCELADO",
} as const;
export const purchaseStatusSchema = z.nativeEnum(PurchaseStatus);
export type PurchaseStatus = z.infer<typeof purchaseStatusSchema>;

/** Estados de uma fatura/cobrança (máquina de estados, roadmap §7.1). */
export const InvoiceStatus = {
  PENDENTE: "PENDENTE",
  PAGA: "PAGA",
  VENCIDA: "VENCIDA",
  CANCELADA: "CANCELADA",
  ESTORNADA: "ESTORNADA",
} as const;
export const invoiceStatusSchema = z.nativeEnum(InvoiceStatus);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

/** Estados de um reembolso (4 cenários CDC, roadmap §21). */
export const RefundStatus = {
  SOLICITADO: "SOLICITADO",
  APROVADO: "APROVADO",
  RECUSADO: "RECUSADO",
  CONCLUIDO: "CONCLUIDO",
} as const;
export const refundStatusSchema = z.nativeEnum(RefundStatus);
export type RefundStatus = z.infer<typeof refundStatusSchema>;

/** Método de pagamento (roadmap §7.1). */
export const PaymentMethod = {
  PIX: "PIX",
  CARTAO: "CARTAO",
  BOLETO: "BOLETO",
} as const;
export const paymentMethodSchema = z.nativeEnum(PaymentMethod);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
