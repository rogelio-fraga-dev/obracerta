import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import type { TermsAcceptance, UserType } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { termsAcceptances } from "../../../infrastructure/database/schema/terms-acceptances.js";
import type { AcceptTermsData, TermsRepository } from "../domain/ports/terms.repository.js";

type TermsRow = typeof termsAcceptances.$inferSelect;

/** Mapeia a linha para o contrato público (sem `ip` — LGPD). */
export function rowToTermsAcceptance(row: TermsRow): TermsAcceptance {
  return {
    id: row.id,
    bookingId: row.bookingId,
    userId: row.userId,
    papel: row.papel as UserType,
    termoVersao: row.termoVersao,
    aceitoEm: row.aceitoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleTermsRepository implements TermsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async accept(data: AcceptTermsData): Promise<TermsAcceptance> {
    const [row] = await this.db
      .insert(termsAcceptances)
      .values({
        bookingId: data.bookingId,
        userId: data.userId,
        papel: data.papel,
        termoVersao: data.termoVersao,
        ip: data.ip,
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar o aceite de termo.");
    return rowToTermsAcceptance(row);
  }

  async findByBookingAndUser(
    bookingId: string,
    userId: string,
  ): Promise<TermsAcceptance | null> {
    const [row] = await this.db
      .select()
      .from(termsAcceptances)
      .where(
        and(eq(termsAcceptances.bookingId, bookingId), eq(termsAcceptances.userId, userId)),
      )
      .limit(1);
    return row ? rowToTermsAcceptance(row) : null;
  }

  async listForBooking(bookingId: string): Promise<TermsAcceptance[]> {
    const rows = await this.db
      .select()
      .from(termsAcceptances)
      .where(eq(termsAcceptances.bookingId, bookingId))
      .orderBy(asc(termsAcceptances.aceitoEm));
    return rows.map(rowToTermsAcceptance);
  }
}
