import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import type { Refund, RefundStatus } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { refunds } from "../../../infrastructure/database/schema/refunds.js";
import type { CreateRefundData, RefundRepository } from "../domain/ports/refund.repository.js";

type RefundRow = typeof refunds.$inferSelect;

export function rowToRefund(row: RefundRow): Refund {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    userId: row.userId,
    valorCentavos: row.valorCentavos,
    motivo: row.motivo,
    status: row.status as RefundStatus,
    solicitadoEm: row.solicitadoEm.toISOString(),
    processadoEm: row.processadoEm ? row.processadoEm.toISOString() : null,
  };
}

@Injectable()
export class DrizzleRefundRepository implements RefundRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateRefundData): Promise<Refund> {
    const [row] = await this.db
      .insert(refunds)
      .values({
        invoiceId: data.invoiceId,
        userId: data.userId,
        valorCentavos: data.valorCentavos,
        motivo: data.motivo,
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar o reembolso.");
    return rowToRefund(row);
  }

  async findById(id: string): Promise<Refund | null> {
    const [row] = await this.db.select().from(refunds).where(eq(refunds.id, id)).limit(1);
    return row ? rowToRefund(row) : null;
  }

  async resolve(id: string, status: RefundStatus, gatewayId: string | null): Promise<Refund | null> {
    const [row] = await this.db
      .update(refunds)
      .set({ status, gatewayId, processadoEm: new Date() })
      .where(eq(refunds.id, id))
      .returning();
    return row ? rowToRefund(row) : null;
  }

  async listForUser(userId: string): Promise<Refund[]> {
    const rows = await this.db
      .select()
      .from(refunds)
      .where(eq(refunds.userId, userId))
      .orderBy(desc(refunds.solicitadoEm));
    return rows.map(rowToRefund);
  }

  async listPending(): Promise<Refund[]> {
    const rows = await this.db
      .select()
      .from(refunds)
      .where(eq(refunds.status, "SOLICITADO"))
      .orderBy(desc(refunds.solicitadoEm));
    return rows.map(rowToRefund);
  }
}
