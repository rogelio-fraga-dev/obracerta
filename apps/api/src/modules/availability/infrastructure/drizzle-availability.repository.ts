import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import type {
  AvailabilitySlot,
  CreateAvailabilitySlotInput,
  ScheduleBlock,
} from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { availability } from "../../../infrastructure/database/schema/availability.js";
import { scheduleBlocks } from "../../../infrastructure/database/schema/schedule-blocks.js";
import type { AvailabilityRepository } from "../domain/ports/availability.repository.js";

type SlotRow = typeof availability.$inferSelect;
type BlockRow = typeof scheduleBlocks.$inferSelect;

/** Mapeia uma linha da grade para o contrato público (puro). */
export function rowToSlot(row: SlotRow): AvailabilitySlot {
  return {
    id: row.id,
    diaSemana: row.diaSemana,
    horaInicio: row.horaInicio,
    horaFim: row.horaFim,
  };
}

/** Mapeia uma linha de bloqueio para o contrato público (timestamps em ISO). */
export function rowToBlock(row: BlockRow): ScheduleBlock {
  return {
    id: row.id,
    inicio: row.inicio.toISOString(),
    fim: row.fim.toISOString(),
    bookingId: row.bookingId,
    motivo: row.motivo,
  };
}

@Injectable()
export class DrizzleAvailabilityRepository implements AvailabilityRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getAvailability(professionalId: string): Promise<AvailabilitySlot[]> {
    const rows = await this.db
      .select()
      .from(availability)
      .where(eq(availability.professionalId, professionalId))
      .orderBy(asc(availability.diaSemana), asc(availability.horaInicio));
    return rows.map(rowToSlot);
  }

  async setAvailability(
    professionalId: string,
    slots: CreateAvailabilitySlotInput[],
  ): Promise<AvailabilitySlot[]> {
    return this.db.transaction(async (tx) => {
      await tx.delete(availability).where(eq(availability.professionalId, professionalId));
      if (slots.length === 0) return [];
      const rows = await tx
        .insert(availability)
        .values(slots.map((slot) => ({ professionalId, ...slot })))
        .returning();
      return rows.map(rowToSlot);
    });
  }

  async listBlocks(professionalId: string): Promise<ScheduleBlock[]> {
    const rows = await this.db
      .select()
      .from(scheduleBlocks)
      .where(eq(scheduleBlocks.professionalId, professionalId))
      .orderBy(asc(scheduleBlocks.inicio));
    return rows.map(rowToBlock);
  }
}
