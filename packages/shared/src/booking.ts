import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";
import { bookingStatusSchema } from "./enums.js";

/**
 * Contratos de agendamento (roadmap §4.2/§7/§11). Um `booking_request` é o pedido
 * de um contratante a um profissional, com expiração de 24h e máquina de estados
 * (PENDENTE → APROVADO/RECUSADO/EXPIRADO → INICIADO → CONCLUIDO/CANCELADO).
 */

/** Pedido de agendamento (visão completa). */
export const bookingRequestSchema = z.object({
  id: uuidSchema,
  contractorId: uuidSchema,
  professionalId: uuidSchema,
  especialidade: z.string().trim().min(2).max(60),
  descricao: z.string().trim().max(1000).nullable(),
  dataServico: isoTimestampSchema,
  status: bookingStatusSchema,
  expiraEm: isoTimestampSchema,
  motivoRecusa: z.string().trim().max(300).nullable(),
  criadoEm: isoTimestampSchema,
  atualizadoEm: isoTimestampSchema,
});
export type BookingRequest = z.infer<typeof bookingRequestSchema>;

/** Criação de um pedido pelo contratante (professional alvo + dados do serviço). */
export const createBookingSchema = z.object({
  professionalId: uuidSchema,
  especialidade: z.string().trim().min(2).max(60),
  descricao: z.string().trim().max(1000).optional(),
  dataServico: isoTimestampSchema,
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/** Recusa de um pedido pelo profissional (motivo obrigatório, §8). */
export const declineBookingSchema = z.object({
  motivo: z.string().trim().min(3).max(300),
});
export type DeclineBookingInput = z.infer<typeof declineBookingSchema>;
