import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import type { ContractorPlan, Purchase, PurchaseStatus } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { purchases } from "../../../infrastructure/database/schema/purchases.js";
import type {
  CreatePurchaseData,
  PurchaseRepository,
} from "../domain/ports/purchase.repository.js";

type PurchaseRow = typeof purchases.$inferSelect;

export function rowToPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    userId: row.userId,
    plano: row.plano as ContractorPlan,
    status: row.status as PurchaseStatus,
    gateway: row.gateway,
    gatewayId: row.gatewayId,
    valorCentavos: row.valorCentavos,
    expiraEm: row.expiraEm ? row.expiraEm.toISOString() : null,
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzlePurchaseRepository implements PurchaseRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreatePurchaseData): Promise<Purchase> {
    const [row] = await this.db
      .insert(purchases)
      .values({
        userId: data.userId,
        plano: data.plano,
        gateway: data.gateway,
        gatewayId: data.gatewayId,
        valorCentavos: data.valorCentavos,
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar a compra.");
    return rowToPurchase(row);
  }

  async findById(id: string): Promise<Purchase | null> {
    const [row] = await this.db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
    return row ? rowToPurchase(row) : null;
  }

  async findActiveByUser(userId: string): Promise<Purchase | null> {
    const [row] = await this.db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.status, "ATIVO")))
      .orderBy(desc(purchases.expiraEm))
      .limit(1);
    return row ? rowToPurchase(row) : null;
  }

  async activate(id: string, expiraEm: string): Promise<Purchase | null> {
    const [row] = await this.db
      .update(purchases)
      .set({ status: "ATIVO", expiraEm: new Date(expiraEm), atualizadoEm: new Date() })
      .where(eq(purchases.id, id))
      .returning();
    return row ? rowToPurchase(row) : null;
  }

  async expire(id: string): Promise<Purchase | null> {
    const [row] = await this.db
      .update(purchases)
      .set({ status: "EXPIRADO", atualizadoEm: new Date() })
      .where(and(eq(purchases.id, id), eq(purchases.status, "ATIVO")))
      .returning();
    return row ? rowToPurchase(row) : null;
  }
}
