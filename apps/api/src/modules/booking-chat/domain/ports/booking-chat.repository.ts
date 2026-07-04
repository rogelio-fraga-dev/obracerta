import type { BookingMessage } from "@obracerta/shared";

/** Dados para persistir uma mensagem do chat do pedido. */
export interface CreateBookingMessageData {
  bookingId: string;
  senderId: string;
  texto: string;
}

/** Porta de saída do chat do pedido. */
export interface BookingChatRepository {
  create(data: CreateBookingMessageData): Promise<BookingMessage>;
  /** Mensagens do pedido em ordem cronológica (com o nome do autor). */
  listForBooking(bookingId: string): Promise<BookingMessage[]>;
}

export const BOOKING_CHAT_REPOSITORY = Symbol("BOOKING_CHAT_REPOSITORY");
