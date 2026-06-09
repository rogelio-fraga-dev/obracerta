import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";
import { documentTypeSchema } from "./enums.js";

/**
 * Ferramentas de gestão do profissional (roadmap §8.5): orçamentos e recibos.
 * Um documento tem itens (descrição + quantidade + valor unitário); o total é
 * derivado e calculado no servidor — nunca confiamos no total vindo do cliente.
 * Tier premium (gating `tools.documents`).
 */

/** Item de um documento (linha do orçamento/recibo). */
export const documentItemSchema = z.object({
  descricao: z.string().trim().min(1).max(200),
  quantidade: z.number().int().positive().max(100_000),
  valorUnitarioCentavos: z.number().int().nonnegative().max(1_000_000_00),
});
export type DocumentItem = z.infer<typeof documentItemSchema>;

/** Documento completo (orçamento ou recibo) emitido por um profissional. */
export const professionalDocumentSchema = z.object({
  id: uuidSchema,
  professionalId: uuidSchema,
  tipo: documentTypeSchema,
  clienteNome: z.string().trim().min(2).max(120),
  titulo: z.string().trim().min(2).max(120),
  observacoes: z.string().trim().max(1000).nullable(),
  itens: z.array(documentItemSchema).min(1).max(50),
  totalCentavos: z.number().int().nonnegative(),
  criadoEm: isoTimestampSchema,
});
export type ProfessionalDocument = z.infer<typeof professionalDocumentSchema>;

/** Criação de um documento (o total NÃO entra — é recalculado no servidor). */
export const createDocumentSchema = z.object({
  tipo: documentTypeSchema,
  clienteNome: z.string().trim().min(2).max(120),
  titulo: z.string().trim().min(2).max(120),
  observacoes: z.string().trim().max(1000).optional(),
  itens: z.array(documentItemSchema).min(1).max(50),
});
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

/** Soma dos itens (quantidade × valor unitário). Fonte única do total. */
export function documentTotalCentavos(itens: readonly DocumentItem[]): number {
  return itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitarioCentavos, 0);
}
