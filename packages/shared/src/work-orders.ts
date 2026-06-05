import { z } from "zod";
import { uuidSchema, isoTimestampSchema, geoPointSchema } from "./primitives.js";
import { centavosSchema } from "./billing.js";
import { workUrgencySchema, workOrderStatusSchema, proposalStatusSchema } from "./enums.js";

/**
 * Contratos de obras e lances (roadmap §4.4/§16). Um contratante abre uma `obra`
 * (work order) com urgência e local; profissionais enviam `propostas` (lances)
 * SIGILOSAS — visíveis só ao contratante e ao próprio autor, nunca entre concorrentes
 * (evita leilão de preço para baixo). `pisoCentavos` é o piso de dignidade (média).
 */

/** Uma obra publicada pelo contratante. */
export const workOrderSchema = z.object({
  id: uuidSchema,
  contractorId: uuidSchema,
  cidadeId: uuidSchema,
  especialidade: z.string().trim().min(2).max(60),
  titulo: z.string().trim().min(3).max(140),
  descricao: z.string().trim().max(2000).nullable(),
  urgencia: workUrgencySchema,
  bairro: z.string().trim().max(120).nullable(),
  geo: geoPointSchema.nullable(),
  pisoCentavos: centavosSchema.nullable(),
  status: workOrderStatusSchema,
  expiraEm: isoTimestampSchema,
  criadoEm: isoTimestampSchema,
  atualizadoEm: isoTimestampSchema,
});
export type WorkOrder = z.infer<typeof workOrderSchema>;

/** Abertura de uma obra pelo contratante (urgência define a expiração no servidor). */
export const createWorkOrderSchema = z.object({
  cidadeId: uuidSchema,
  especialidade: z.string().trim().min(2).max(60),
  titulo: z.string().trim().min(3).max(140),
  descricao: z.string().trim().max(2000).optional(),
  urgencia: workUrgencySchema,
  bairro: z.string().trim().max(120).optional(),
  geo: geoPointSchema.optional(),
});
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

/** Uma proposta/lance sigiloso de um profissional para uma obra. */
export const proposalSchema = z.object({
  id: uuidSchema,
  workOrderId: uuidSchema,
  professionalId: uuidSchema,
  valorCentavos: centavosSchema,
  prazoDias: z.number().int().positive().max(365).nullable(),
  mensagem: z.string().trim().max(1000).nullable(),
  status: proposalStatusSchema,
  criadoEm: isoTimestampSchema,
  atualizadoEm: isoTimestampSchema,
});
export type Proposal = z.infer<typeof proposalSchema>;

/** Envio de um lance pelo profissional. */
export const createProposalSchema = z.object({
  workOrderId: uuidSchema,
  valorCentavos: centavosSchema,
  prazoDias: z.number().int().positive().max(365).optional(),
  mensagem: z.string().trim().max(1000).optional(),
});
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
