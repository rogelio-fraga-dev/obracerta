import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import type { BookingMessage } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { bookingMessages } from "../../../infrastructure/database/schema/booking-messages.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import type {
  BookingChatRepository,
  CreateBookingMessageData,
} from "../domain/ports/booking-chat.repository.js";

@Injectable()
export class DrizzleBookingChatRepository implements BookingChatRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateBookingMessageData): Promise<BookingMessage> {
    const [row] = await this.db
      .insert(bookingMessages)
      .values({ bookingId: data.bookingId, senderId: data.senderId, texto: data.texto })
      .returning();
    if (!row) throw new Error("Falha ao enviar a mensagem.");
    const [sender] = await this.db
      .select({ nome: users.nomeCompleto })
      .from(users)
      .where(eq(users.id, data.senderId))
      .limit(1);
    return {
      id: row.id,
      bookingId: row.bookingId,
      senderId: row.senderId,
      senderNome: sender?.nome ?? null,
      texto: row.texto,
      criadoEm: row.criadoEm.toISOString(),
    };
  }

  async listForBooking(bookingId: string): Promise<BookingMessage[]> {
    const rows = await this.db
      .select({
        id: bookingMessages.id,
        bookingId: bookingMessages.bookingId,
        senderId: bookingMessages.senderId,
        senderNome: users.nomeCompleto,
        texto: bookingMessages.texto,
        criadoEm: bookingMessages.criadoEm,
      })
      .from(bookingMessages)
      .leftJoin(users, eq(users.id, bookingMessages.senderId))
      .where(eq(bookingMessages.bookingId, bookingId))
      .orderBy(asc(bookingMessages.criadoEm));
    return rows.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      senderId: r.senderId,
      senderNome: r.senderNome,
      texto: r.texto,
      criadoEm: r.criadoEm.toISOString(),
    }));
  }
}
