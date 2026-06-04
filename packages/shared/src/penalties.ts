import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";

/**
 * Penalidades por recusa/cancelamento (roadmap §8). APPEND-ONLY. A escala e os
 * motivos válidos/bloqueados são regra de domínio no módulo `decline-penalty`;
 * aqui ficam apenas os contratos de leitura expostos ao profissional.
 */

/** Uma penalidade aplicada (imutável). */
export const penaltySchema = z.object({
  id: uuidSchema,
  professionalId: uuidSchema,
  bookingId: uuidSchema.nullable(),
  motivo: z.string().trim().min(1).max(80),
  pontos: z.number().int().min(1),
  detalhe: z.string().trim().max(300).nullable(),
  criadoEm: isoTimestampSchema,
});
export type Penalty = z.infer<typeof penaltySchema>;

/** Resumo de comportamento do profissional (taxa de aceitação + pontos, §8). */
export const penaltySummarySchema = z.object({
  totalPedidos: z.number().int().min(0),
  aprovados: z.number().int().min(0),
  recusados: z.number().int().min(0),
  expirados: z.number().int().min(0),
  taxaAceitacao: z.number().min(0).max(1),
  pontosPenalidade: z.number().int().min(0),
});
export type PenaltySummary = z.infer<typeof penaltySummarySchema>;
