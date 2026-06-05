import { Inject, Injectable } from "@nestjs/common";
import { count, desc, eq, sql, sum } from "drizzle-orm";
import type { Penalty } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { penalties } from "../../../infrastructure/database/schema/penalties.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import type {
  CreatePenaltyData,
  PenaltyRepository,
  ProfessionalBookingCounts,
} from "../domain/ports/penalty.repository.js";

type PenaltyRow = typeof penalties.$inferSelect;

export function rowToPenalty(row: PenaltyRow): Penalty {
  return {
    id: row.id,
    professionalId: row.professionalId,
    bookingId: row.bookingId,
    motivo: row.motivo,
    pontos: row.pontos,
    detalhe: row.detalhe,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzlePenaltyRepository implements PenaltyRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreatePenaltyData): Promise<Penalty> {
    const [row] = await this.db
      .insert(penalties)
      .values({
        professionalId: data.professionalId,
        bookingId: data.bookingId,
        motivo: data.motivo,
        pontos: data.pontos,
        detalhe: data.detalhe,
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar a penalidade.");
    return rowToPenalty(row);
  }

  async countForProfessional(professionalId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(penalties)
      .where(eq(penalties.professionalId, professionalId));
    return row?.total ?? 0;
  }

  async sumPoints(professionalId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sum(penalties.pontos) })
      .from(penalties)
      .where(eq(penalties.professionalId, professionalId));
    return Number(row?.total ?? 0);
  }

  async listForProfessional(professionalId: string): Promise<Penalty[]> {
    const rows = await this.db
      .select()
      .from(penalties)
      .where(eq(penalties.professionalId, professionalId))
      .orderBy(desc(penalties.criadoEm));
    return rows.map(rowToPenalty);
  }

  async bookingCounts(professionalId: string): Promise<ProfessionalBookingCounts> {
    const statusCount = (status: string) =>
      sql<number>`count(*) filter (where ${bookingRequests.status} = ${status}::booking_status)::int`;
    const [row] = await this.db
      .select({
        total: count(),
        aprovados: statusCount("APROVADO"),
        recusados: statusCount("RECUSADO"),
        expirados: statusCount("EXPIRADO"),
      })
      .from(bookingRequests)
      .where(eq(bookingRequests.professionalId, professionalId));
    return {
      total: row?.total ?? 0,
      aprovados: row?.aprovados ?? 0,
      recusados: row?.recusados ?? 0,
      expirados: row?.expirados ?? 0,
    };
  }
}
