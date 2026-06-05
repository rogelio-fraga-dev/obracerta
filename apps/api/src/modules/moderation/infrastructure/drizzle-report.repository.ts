import { Inject, Injectable } from "@nestjs/common";
import { asc, eq, sql } from "drizzle-orm";
import type { Report, ReportStatus, ReportTarget } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { reports } from "../../../infrastructure/database/schema/reports.js";
import type { CreateReportData, ReportRepository } from "../domain/ports/report.repository.js";

type ReportRow = typeof reports.$inferSelect;

export function rowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    denuncianteId: row.denuncianteId,
    entidade: row.entidade as ReportTarget,
    entidadeId: row.entidadeId,
    motivo: row.motivo,
    detalhe: row.detalhe,
    status: row.status as ReportStatus,
    resolvidoEm: row.resolvidoEm ? row.resolvidoEm.toISOString() : null,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleReportRepository implements ReportRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateReportData): Promise<Report> {
    const [row] = await this.db
      .insert(reports)
      .values({
        denuncianteId: data.denuncianteId,
        entidade: data.entidade,
        entidadeId: data.entidadeId,
        motivo: data.motivo,
        detalhe: data.detalhe,
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar a denúncia.");
    return rowToReport(row);
  }

  async findById(id: string): Promise<Report | null> {
    const [row] = await this.db.select().from(reports).where(eq(reports.id, id)).limit(1);
    return row ? rowToReport(row) : null;
  }

  async setStatus(id: string, status: ReportStatus, resolvido: boolean): Promise<Report | null> {
    const [row] = await this.db
      .update(reports)
      .set({ status, resolvidoEm: resolvido ? new Date() : null })
      .where(eq(reports.id, id))
      .returning();
    return row ? rowToReport(row) : null;
  }

  async listOpen(): Promise<Report[]> {
    const rows = await this.db
      .select()
      .from(reports)
      .where(eq(reports.status, "ABERTA"))
      .orderBy(asc(reports.criadoEm));
    return rows.map(rowToReport);
  }

  async countProcedenteForOffender(offenderId: string): Promise<number> {
    // Conta strikes procedentes contra o usuário diretamente (USER/PROFILE) OU
    // contra avaliações que ele escreveu (REVIEW → reviews.autor_id). Lê reviews
    // direto (read-only cross-table, mesmo padrão da taxa de aceitação na 2.4).
    const res = await this.db.execute(sql`
      select count(*)::int as total
      from reports r
      left join reviews rv on r.entidade = 'REVIEW' and r.entidade_id = rv.id::text
      where r.status = 'PROCEDENTE'
        and (
          (r.entidade in ('USER', 'PROFILE') and r.entidade_id = ${offenderId})
          or rv.autor_id = ${offenderId}
        )
    `);
    const row = res.rows[0] as { total: number } | undefined;
    return Number(row?.total ?? 0);
  }
}
