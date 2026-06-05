import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";
import { reportStatusSchema, suspensionStatusSchema } from "./enums.js";

/**
 * Moderação (roadmap §13). Uma denúncia procedente oculta o conteúdo por 48h e
 * pode disparar suspensão automática da conta, com direito de apelação. `entidade`
 * + `entidadeId` apontam o alvo de forma genérica (REVIEW/USER/PROFILE), no mesmo
 * padrão do `audit_log`. `motivo` é catálogo de domínio (string livre).
 */

/** Tipo de entidade denunciável. */
export const reportTargetSchema = z.enum(["REVIEW", "USER", "PROFILE"]);
export type ReportTarget = z.infer<typeof reportTargetSchema>;

/** Uma denúncia registrada. */
export const reportSchema = z.object({
  id: uuidSchema,
  denuncianteId: uuidSchema.nullable(),
  entidade: reportTargetSchema,
  entidadeId: z.string().trim().min(1).max(64),
  motivo: z.string().trim().min(2).max(80),
  detalhe: z.string().trim().max(1000).nullable(),
  status: reportStatusSchema,
  resolvidoEm: isoTimestampSchema.nullable(),
  criadoEm: isoTimestampSchema,
});
export type Report = z.infer<typeof reportSchema>;

/** Entrada para denunciar um conteúdo/usuário. */
export const createReportSchema = z.object({
  entidade: reportTargetSchema,
  entidadeId: z.string().trim().min(1).max(64),
  motivo: z.string().trim().min(2).max(80),
  detalhe: z.string().trim().max(1000).optional(),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

/** Uma suspensão de conta (origem em denúncia procedente ou regra automática). */
export const suspensionSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  reportId: uuidSchema.nullable(),
  motivo: z.string().trim().min(2).max(120),
  status: suspensionStatusSchema,
  inicioEm: isoTimestampSchema,
  fimEm: isoTimestampSchema.nullable(),
  apelacaoTexto: z.string().trim().max(1000).nullable(),
  apeladaEm: isoTimestampSchema.nullable(),
  resolvidoEm: isoTimestampSchema.nullable(),
});
export type Suspension = z.infer<typeof suspensionSchema>;

/** Entrada de apelação do usuário suspenso. */
export const appealSuspensionSchema = z.object({
  suspensionId: uuidSchema,
  texto: z.string().trim().min(10).max(1000),
});
export type AppealSuspensionInput = z.infer<typeof appealSuspensionSchema>;
