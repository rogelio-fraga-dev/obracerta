import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";
import {
  bookingStatusSchema,
  BookingStatus,
  declineReasonSchema,
  DeclineReason,
} from "./enums.js";

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
  fotoUrl: z.string().url().nullable(),
  dataServico: isoTimestampSchema,
  status: bookingStatusSchema,
  expiraEm: isoTimestampSchema,
  motivoRecusa: z.string().trim().max(300).nullable(),
  /** Reagendamento pendente: nova data proposta (null = sem proposta). */
  reagendamentoData: isoTimestampSchema.nullable(),
  /** Quem propôs o reagendamento (a OUTRA parte confirma). */
  reagendamentoPor: uuidSchema.nullable(),
  criadoEm: isoTimestampSchema,
  atualizadoEm: isoTimestampSchema,
});
export type BookingRequest = z.infer<typeof bookingRequestSchema>;

/**
 * Item da listagem de pedidos: o pedido + identificação da **outra parte**
 * (nome/foto são públicos — o que fica selado até o aceite é o CONTATO, §24).
 */
export const bookingListItemSchema = bookingRequestSchema.extend({
  outraParteNome: z.string().nullable(),
  outraParteFotoUrl: z.string().nullable(),
});
export type BookingListItem = z.infer<typeof bookingListItemSchema>;

/**
 * Contato de uma das partes, liberado **só após o aceite** (§24, double-blind).
 * Até o profissional aprovar o pedido, ninguém vê WhatsApp/e-mail do outro — a
 * plataforma intermedia a conexão; o contrato em si é direto entre as partes.
 */
export const bookingContactSchema = z.object({
  nome: z.string(),
  whatsapp: z.string(),
  email: z.string().nullable(),
});
export type BookingContact = z.infer<typeof bookingContactSchema>;

/** Estados em que o contato das partes está liberado (pós-aceite). */
const CONTACT_RELEASED_STATUSES: readonly BookingStatus[] = [
  BookingStatus.APROVADO,
  BookingStatus.INICIADO,
  BookingStatus.CONCLUIDO,
];

/** O contato já foi liberado neste estado do pedido? Fonte única (API + web). */
export function isBookingContactReleased(status: BookingStatus): boolean {
  return CONTACT_RELEASED_STATUSES.includes(status);
}

/** Criação de um pedido pelo contratante (professional alvo + dados do serviço). */
export const createBookingSchema = z.object({
  professionalId: uuidSchema,
  especialidade: z.string().trim().min(2).max(60),
  descricao: z.string().trim().max(1000).optional(),
  dataServico: isoTimestampSchema,
});
// A foto (anexo) NÃO entra na criação JSON — sobe depois por multipart
// (`POST /bookings/:id/foto`), espelhando o upload da foto de perfil.
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Recusa de um pedido pelo profissional (roadmap §8). `motivo` é categorizado
 * (válido/penalizável); `detalhe` é texto livre opcional, obrigatório em OUTRO.
 */
export const declineBookingSchema = z
  .object({
    motivo: declineReasonSchema,
    detalhe: z.string().trim().max(300).optional(),
  })
  .refine((d) => d.motivo !== DeclineReason.OUTRO || (d.detalhe?.length ?? 0) >= 3, {
    message: "Descreva o motivo quando escolher OUTRO.",
    path: ["detalhe"],
  });
export type DeclineBookingInput = z.infer<typeof declineBookingSchema>;

/**
 * Proposta de reagendamento (roadmap §7): qualquer participante propõe uma nova
 * data para um pedido APROVADO; a outra parte confirma ou recusa. `novaData` no
 * futuro (validado também no servidor).
 */
export const rescheduleBookingSchema = z.object({
  novaData: isoTimestampSchema,
});
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

/** Há um reagendamento pendente aguardando confirmação? Fonte única (API + web). */
export function hasPendingReschedule(
  booking: Pick<BookingRequest, "reagendamentoData">,
): boolean {
  return booking.reagendamentoData !== null;
}
