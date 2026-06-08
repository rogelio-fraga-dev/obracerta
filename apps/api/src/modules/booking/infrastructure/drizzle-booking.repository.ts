import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq } from "drizzle-orm";
import type { BookingRequest, BookingStatus } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import type { BookingRepository, CreateBookingData } from "../domain/ports/booking.repository.js";

type BookingRow = typeof bookingRequests.$inferSelect;

/** Mapeia a linha do pedido para o contrato público (timestamps em ISO). */
export function rowToBooking(row: BookingRow): BookingRequest {
  return {
    id: row.id,
    contractorId: row.contractorId,
    professionalId: row.professionalId,
    especialidade: row.especialidade,
    descricao: row.descricao,
    dataServico: row.dataServico.toISOString(),
    status: row.status as BookingStatus,
    expiraEm: row.expiraEm.toISOString(),
    motivoRecusa: row.motivoRecusa,
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleBookingRepository implements BookingRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateBookingData): Promise<BookingRequest> {
    const [row] = await this.db
      .insert(bookingRequests)
      .values({
        contractorId: data.contractorId,
        professionalId: data.professionalId,
        especialidade: data.especialidade,
        descricao: data.descricao,
        dataServico: new Date(data.dataServico),
        expiraEm: new Date(data.expiraEm),
      })
      .returning();
    if (!row) throw new Error("Falha ao criar o pedido de agendamento.");
    return rowToBooking(row);
  }

  async findById(id: string): Promise<BookingRequest | null> {
    const [row] = await this.db
      .select()
      .from(bookingRequests)
      .where(eq(bookingRequests.id, id))
      .limit(1);
    return row ? rowToBooking(row) : null;
  }

  async countPending(contractorId: string, especialidade: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.contractorId, contractorId),
          eq(bookingRequests.especialidade, especialidade),
          eq(bookingRequests.status, "PENDENTE"),
        ),
      );
    return row?.total ?? 0;
  }

  async listForProfessional(professionalId: string): Promise<BookingRequest[]> {
    const rows = await this.db
      .select()
      .from(bookingRequests)
      .where(eq(bookingRequests.professionalId, professionalId))
      .orderBy(desc(bookingRequests.criadoEm));
    return rows.map(rowToBooking);
  }

  async listForContractor(contractorId: string): Promise<BookingRequest[]> {
    const rows = await this.db
      .select()
      .from(bookingRequests)
      .where(eq(bookingRequests.contractorId, contractorId))
      .orderBy(desc(bookingRequests.criadoEm));
    return rows.map(rowToBooking);
  }

  async findAll(): Promise<BookingRequest[]> {
    const rows = await this.db
      .select()
      .from(bookingRequests)
      .orderBy(desc(bookingRequests.criadoEm));
    return rows.map(rowToBooking);
  }

  async findAllPaginated(limit: number, offset: number): Promise<{ items: BookingRequest[], total: number }> {
    const rows = await this.db
      .select()
      .from(bookingRequests)
      .orderBy(desc(bookingRequests.criadoEm))
      .limit(limit)
      .offset(offset);
    const [c] = await this.db.select({ total: count() }).from(bookingRequests);
    return { items: rows.map(rowToBooking), total: c?.total ?? 0 };
  }

  async transitionStatus(
    id: string,
    expectedFrom: BookingStatus,
    to: BookingStatus,
    patch?: { motivoRecusa?: string },
  ): Promise<BookingRequest | null> {
    const [row] = await this.db
      .update(bookingRequests)
      .set({ status: to, atualizadoEm: new Date(), ...patch })
      .where(and(eq(bookingRequests.id, id), eq(bookingRequests.status, expectedFrom)))
      .returning();
    return row ? rowToBooking(row) : null;
  }
}
