import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";

/**
 * Chat do pedido (pós-aceite): a conversa entre contratante e profissional fica
 * centralizada no pedido — histórico junto do serviço. Liberado só depois do
 * aceite (o contato segue double-blind até lá, §24).
 */

/** Mensagem do chat de um pedido. */
export const bookingMessageSchema = z.object({
  id: uuidSchema,
  bookingId: uuidSchema,
  senderId: uuidSchema,
  /** Nome de exibição do autor (para o balão). */
  senderNome: z.string().nullable(),
  texto: z.string().min(1).max(2000),
  criadoEm: isoTimestampSchema,
});
export type BookingMessage = z.infer<typeof bookingMessageSchema>;

/** Envio de mensagem no chat do pedido. */
export const createBookingMessageSchema = z.object({
  texto: z.string().trim().min(1, "Escreva uma mensagem.").max(2000),
});
export type CreateBookingMessageInput = z.infer<typeof createBookingMessageSchema>;
