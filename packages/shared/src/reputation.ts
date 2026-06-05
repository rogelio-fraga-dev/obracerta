import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";

/**
 * Reputação derivada: badges e trilha de eventos (roadmap §4.3/§12). O catálogo de
 * badges e os critérios de concessão são regra de domínio do módulo `reputation`
 * (por isso `codigo`/`tipo` são strings livres, não enums espelhados — eles evoluem
 * sem migration, como `penalties.motivo`). `reputation_events` é APPEND-ONLY.
 */

/** Um selo conquistado pelo usuário (ativo enquanto `revogadoEm` for nulo). */
export const badgeSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  codigo: z.string().trim().min(2).max(40),
  concedidoEm: isoTimestampSchema,
  revogadoEm: isoTimestampSchema.nullable(),
});
export type Badge = z.infer<typeof badgeSchema>;

/** Um evento na trilha de reputação (imutável). `referenciaId` aponta avaliação/badge/denúncia. */
export const reputationEventSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  tipo: z.string().trim().min(2).max(60),
  referenciaId: z.string().trim().max(64).nullable(),
  criadoEm: isoTimestampSchema,
});
export type ReputationEvent = z.infer<typeof reputationEventSchema>;

/** Resumo público de reputação de um profissional (§12). */
export const reputationSummarySchema = z.object({
  totalAvaliacoes: z.number().int().min(0),
  mediaNota: z.number().min(0).max(5),
  badges: z.array(z.string().trim().min(2).max(40)),
});
export type ReputationSummary = z.infer<typeof reputationSummarySchema>;
