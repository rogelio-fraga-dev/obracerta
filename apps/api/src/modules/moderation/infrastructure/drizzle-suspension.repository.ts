import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import type { Suspension, SuspensionStatus } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { accountSuspensions } from "../../../infrastructure/database/schema/account-suspensions.js";
import type {
  CreateSuspensionData,
  SuspensionRepository,
} from "../domain/ports/suspension.repository.js";

type SuspensionRow = typeof accountSuspensions.$inferSelect;

export function rowToSuspension(row: SuspensionRow): Suspension {
  return {
    id: row.id,
    userId: row.userId,
    reportId: row.reportId,
    motivo: row.motivo,
    status: row.status as SuspensionStatus,
    inicioEm: row.inicioEm.toISOString(),
    fimEm: row.fimEm ? row.fimEm.toISOString() : null,
    apelacaoTexto: row.apelacaoTexto,
    apeladaEm: row.apeladaEm ? row.apeladaEm.toISOString() : null,
    resolvidoEm: row.resolvidoEm ? row.resolvidoEm.toISOString() : null,
  };
}

@Injectable()
export class DrizzleSuspensionRepository implements SuspensionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateSuspensionData): Promise<Suspension> {
    const [row] = await this.db
      .insert(accountSuspensions)
      .values({
        userId: data.userId,
        reportId: data.reportId,
        motivo: data.motivo,
        fimEm: data.fimEm ? new Date(data.fimEm) : null,
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar a suspensão.");
    return rowToSuspension(row);
  }

  async findById(id: string): Promise<Suspension | null> {
    const [row] = await this.db
      .select()
      .from(accountSuspensions)
      .where(eq(accountSuspensions.id, id))
      .limit(1);
    return row ? rowToSuspension(row) : null;
  }

  async activeForUser(userId: string): Promise<Suspension | null> {
    const [row] = await this.db
      .select()
      .from(accountSuspensions)
      .where(and(eq(accountSuspensions.userId, userId), eq(accountSuspensions.status, "ATIVA")))
      .orderBy(desc(accountSuspensions.inicioEm))
      .limit(1);
    return row ? rowToSuspension(row) : null;
  }

  async appeal(id: string, texto: string): Promise<Suspension | null> {
    const [row] = await this.db
      .update(accountSuspensions)
      .set({ status: "APELADA", apelacaoTexto: texto, apeladaEm: new Date() })
      .where(and(eq(accountSuspensions.id, id), eq(accountSuspensions.status, "ATIVA")))
      .returning();
    return row ? rowToSuspension(row) : null;
  }

  async resolve(
    id: string,
    status: SuspensionStatus,
    resolvido: boolean,
  ): Promise<Suspension | null> {
    const [row] = await this.db
      .update(accountSuspensions)
      .set({ status, resolvidoEm: resolvido ? new Date() : null })
      .where(eq(accountSuspensions.id, id))
      .returning();
    return row ? rowToSuspension(row) : null;
  }

  async listForUser(userId: string): Promise<Suspension[]> {
    const rows = await this.db
      .select()
      .from(accountSuspensions)
      .where(eq(accountSuspensions.userId, userId))
      .orderBy(desc(accountSuspensions.inicioEm));
    return rows.map(rowToSuspension);
  }

  async listAppealed(): Promise<Suspension[]> {
    const rows = await this.db
      .select()
      .from(accountSuspensions)
      .where(eq(accountSuspensions.status, "APELADA"))
      .orderBy(desc(accountSuspensions.apeladaEm));
    return rows.map(rowToSuspension);
  }
}
