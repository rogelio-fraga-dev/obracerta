import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import {
  isBookingContactReleased,
  type BookingMessage,
  type BookingRequest,
} from "@obracerta/shared";
import { BookingService } from "../../booking/application/booking.service.js";
import { InboxService } from "../../notifications/application/inbox.service.js";
import {
  BOOKING_CHAT_REPOSITORY,
  type BookingChatRepository,
} from "../domain/ports/booking-chat.repository.js";

/**
 * Chat do pedido: conversa entre as partes centralizada no pedido. Abre junto
 * com o contato (pós-aceite, §24) — antes disso a plataforma intermedia e o
 * canal fica fechado. Só participantes leem/escrevem (guard do BookingService).
 */
@Injectable()
export class BookingChatService {
  constructor(
    @Inject(BOOKING_CHAT_REPOSITORY) private readonly repo: BookingChatRepository,
    private readonly bookings: BookingService,
    private readonly inbox: InboxService,
  ) {}

  async list(userId: string, bookingId: string): Promise<BookingMessage[]> {
    await this.getOpenChatBooking(userId, bookingId);
    return this.repo.listForBooking(bookingId);
  }

  async send(userId: string, bookingId: string, texto: string): Promise<BookingMessage> {
    const booking = await this.getOpenChatBooking(userId, bookingId);
    const message = await this.repo.create({ bookingId, senderId: userId, texto });
    // Avisa a outra parte no sino (best-effort; a mensagem em si já foi salva).
    const otherId =
      booking.contractorId === userId ? booking.professionalId : booking.contractorId;
    await this.inbox.record(otherId, "PEDIDO", "Nova mensagem no pedido", {
      corpo: texto.length > 120 ? `${texto.slice(0, 120)}…` : texto,
      link: `/pedidos/${bookingId}`,
    });
    return message;
  }

  /** Pedido do participante com o chat aberto (mesma janela do contato). */
  private async getOpenChatBooking(userId: string, bookingId: string): Promise<BookingRequest> {
    const booking = await this.bookings.getForParticipant(userId, bookingId);
    if (!isBookingContactReleased(booking.status)) {
      throw new ForbiddenException(
        "O chat abre depois que o profissional aceita o pedido.",
      );
    }
    return booking;
  }
}
