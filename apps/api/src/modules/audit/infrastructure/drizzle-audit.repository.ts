import { Inject, Injectable } from "@nestjs/common";
import { asc, desc, sql } from "drizzle-orm";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { auditLog } from "../../../infrastructure/database/schema/audit-log.js";
import { computeHash } from "../domain/audit-hash.js";
import type {
  AppendAuditData,
  AuditEntry,
  AuditRepository,
} from "../domain/ports/audit.repository.js";

type AuditRow = typeof auditLog.$inferSelect;

/**
 * Chave do advisory lock que serializa os appends. Sem ele, dois inserts
 * concorrentes leriam o mesmo último hash e a cadeia se ramificaria.
 */
const AUDIT_LOCK_KEY = 982_451_653;

export function rowToAuditEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    seq: row.seq,
    atorUserId: row.atorUserId,
    acao: row.acao,
    entidade: row.entidade,
    entidadeId: row.entidadeId,
    dados: row.dados,
    hashPrev: row.hashPrev,
    hash: row.hash,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleAuditRepository implements AuditRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async append(data: AppendAuditData): Promise<AuditEntry> {
    return this.db.transaction(async (tx) => {
      // serializa appends concorrentes (cadeia linear, sem ramificação)
      await tx.execute(sql`select pg_advisory_xact_lock(${AUDIT_LOCK_KEY})`);

      const [last] = await tx
        .select({ hash: auditLog.hash })
        .from(auditLog)
        .orderBy(desc(auditLog.seq))
        .limit(1);
      const hashPrev = last?.hash ?? null;

      const criadoEm = new Date();
      const hash = computeHash(hashPrev, {
        atorUserId: data.atorUserId,
        acao: data.acao,
        entidade: data.entidade,
        entidadeId: data.entidadeId,
        dados: data.dados ?? null,
        criadoEm: criadoEm.toISOString(),
      });

      const [row] = await tx
        .insert(auditLog)
        .values({
          atorUserId: data.atorUserId,
          acao: data.acao,
          entidade: data.entidade,
          entidadeId: data.entidadeId,
          dados: data.dados ?? null,
          hashPrev,
          hash,
          criadoEm,
        })
        .returning();
      if (!row) throw new Error("Falha ao registrar auditoria.");
      return rowToAuditEntry(row);
    });
  }

  async listOrdered(): Promise<AuditEntry[]> {
    const rows = await this.db.select().from(auditLog).orderBy(asc(auditLog.seq));
    return rows.map(rowToAuditEntry);
  }
}
