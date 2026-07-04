import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";

/**
 * Suporte (central de ajuda): o usuário abre um chamado; o admin responde pelo
 * painel. Fluxo simples de 1 resposta — conversas longas vão para o chat/e-mail.
 */

export const supportCategorySchema = z.enum([
  "CONTA",
  "PEDIDO",
  "OBRA",
  "PAGAMENTO",
  "DENUNCIA",
  "OUTRO",
]);
export type SupportCategory = z.infer<typeof supportCategorySchema>;

export const supportStatusSchema = z.enum(["ABERTO", "RESPONDIDO", "FECHADO"]);
export type SupportStatus = z.infer<typeof supportStatusSchema>;

/** Um chamado de suporte (visão do dono; o admin vê também o autor). */
export const supportTicketSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  categoria: supportCategorySchema,
  assunto: z.string().min(1).max(140),
  mensagem: z.string().min(1).max(4000),
  status: supportStatusSchema,
  resposta: z.string().max(4000).nullable(),
  respondidoEm: isoTimestampSchema.nullable(),
  criadoEm: isoTimestampSchema,
});
export type SupportTicket = z.infer<typeof supportTicketSchema>;

/** Ticket na visão do admin (inclui quem abriu). */
export const adminSupportTicketSchema = supportTicketSchema.extend({
  autorNome: z.string().nullable(),
  autorEmail: z.string().nullable(),
});
export type AdminSupportTicket = z.infer<typeof adminSupportTicketSchema>;

/** Abertura de chamado. */
export const createSupportTicketSchema = z.object({
  categoria: supportCategorySchema,
  assunto: z.string().trim().min(3, "Resuma o assunto.").max(140),
  mensagem: z.string().trim().min(10, "Descreva o problema com mais detalhes.").max(4000),
});
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

/** Resposta do admin. */
export const respondSupportTicketSchema = z.object({
  resposta: z.string().trim().min(1, "Escreva a resposta.").max(4000),
});
export type RespondSupportTicketInput = z.infer<typeof respondSupportTicketSchema>;
