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
