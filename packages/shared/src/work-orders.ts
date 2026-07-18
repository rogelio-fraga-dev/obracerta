import { z } from "zod";
import { uuidSchema, isoTimestampSchema, geoPointSchema } from "./primitives.js";
import { centavosSchema } from "./billing.js";
import { paginationMetaSchema } from "./pagination.js";
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
  /** Foto ilustrativa da obra (anexada pelo dono após criar, multipart). */
  fotoUrl: z.string().url().nullable(),
  geo: geoPointSchema.nullable(),
  pisoCentavos: centavosSchema.nullable(),
  status: workOrderStatusSchema,
  expiraEm: isoTimestampSchema,
  criadoEm: isoTimestampSchema,
  atualizadoEm: isoTimestampSchema,
  /** Obra em destaque (dona é Empresa PRO com plano vigente) — sobe na listagem. */
  destaque: z.boolean().optional(),
  /** Identidade da empresa dona (visível a partir do plano Completo da empresa). */
  empresa: z.object({ nome: z.string().min(1).max(160) }).nullable().optional(),
});
export type WorkOrder = z.infer<typeof workOrderSchema>;

/**
 * Relatório da operação da **empresa** (Empresa PRO — homologação 18/07):
 * obras publicadas, propostas recebidas, contratações e indicadores.
 */
export const companyReportSchema = z.object({
  obras: z.object({
    total: z.number().int().min(0),
    abertas: z.number().int().min(0),
    emAndamento: z.number().int().min(0),
    concluidas: z.number().int().min(0),
    encerradasSemContratacao: z.number().int().min(0),
  }),
  propostas: z.object({
    recebidas: z.number().int().min(0),
    mediaPorObra: z.number().min(0),
  }),
  contratacoes: z.object({
    total: z.number().int().min(0),
    valorTotalCentavos: z.number().int().min(0),
    valorMedioCentavos: z.number().int().min(0),
    /** Horas médias entre abrir a obra e adjudicar (null sem contratação). */
    tempoMedioAteContratarHoras: z.number().min(0).nullable(),
  }),
  topEspecialidades: z.array(
    z.object({ especialidade: z.string(), total: z.number().int().min(0) }),
  ),
});
export type CompanyReport = z.infer<typeof companyReportSchema>;

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

/** Corpo do lance quando a obra vem na rota (`POST /work-orders/:id/proposals`). */
export const submitProposalSchema = z.object({
  valorCentavos: centavosSchema,
  prazoDias: z.number().int().positive().max(365).optional(),
  mensagem: z.string().trim().max(1000).optional(),
});
export type SubmitProposalInput = z.infer<typeof submitProposalSchema>;

/** Máximo de fotos na galeria de uma obra. */
export const MAX_WORK_ORDER_PHOTOS = 6;

/** Foto da galeria da obra. */
export const workOrderPhotoSchema = z.object({
  id: uuidSchema,
  workOrderId: uuidSchema,
  url: z.string().url(),
  criadoEm: isoTimestampSchema,
});
export type WorkOrderPhoto = z.infer<typeof workOrderPhotoSchema>;

/** Filtros + paginação da descoberta de obras abertas. */
export const workOrderQuerySchema = z.object({
  cidadeId: uuidSchema.optional(),
  especialidade: z.string().trim().min(2).max(60).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type WorkOrderQuery = z.infer<typeof workOrderQuerySchema>;

/** Página de obras (descoberta). */
export const workOrdersPageSchema = z.object({
  items: z.array(workOrderSchema),
  meta: paginationMetaSchema,
});
export type WorkOrdersPage = z.infer<typeof workOrdersPageSchema>;
