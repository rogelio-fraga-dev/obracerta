import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Coupon, CouponType } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import {
  coupons,
  couponRedemptions,
} from "../../../infrastructure/database/schema/coupons.js";
import type {
  CouponsRepository,
  CreateCouponData,
} from "../domain/ports/coupons.repository.js";

type CouponRow = typeof coupons.$inferSelect;

/** Converte a linha do banco no contrato público `Coupon`. */
export function rowToCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao,
    tipo: row.tipo as CouponType,
    valor: row.valor,
    validoAte: row.validoAte ? row.validoAte.toISOString() : null,
    usosMax: row.usosMax,
    usosCount: row.usosCount,
    ativo: row.ativo,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleCouponsRepository implements CouponsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateCouponData): Promise<Coupon> {
    const [row] = await this.db
      .insert(coupons)
      .values({
        codigo: data.codigo,
        descricao: data.descricao,
        tipo: data.tipo,
        valor: data.valor,
        validoAte: data.validoAte,
        usosMax: data.usosMax,
      })
      .returning();
    if (!row) throw new Error("Falha ao criar cupom.");
    return rowToCoupon(row);
  }

  async findByCodigo(codigo: string): Promise<Coupon | null> {
    const [row] = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.codigo, codigo))
      .limit(1);
    return row ? rowToCoupon(row) : null;
  }

  async findById(id: string): Promise<Coupon | null> {
    const [row] = await this.db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    return row ? rowToCoupon(row) : null;
  }

  async listAll(): Promise<Coupon[]> {
    const rows = await this.db.select().from(coupons).orderBy(desc(coupons.criadoEm));
    return rows.map(rowToCoupon);
  }

  async setAtivo(id: string, ativo: boolean): Promise<void> {
    await this.db.update(coupons).set({ ativo }).where(eq(coupons.id, id));
  }

  async hasRedeemed(couponId: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: couponRedemptions.id })
      .from(couponRedemptions)
      .where(
        and(eq(couponRedemptions.couponId, couponId), eq(couponRedemptions.userId, userId)),
      )
      .limit(1);
    return row !== undefined;
  }

  async redeem(couponId: string, userId: string): Promise<boolean> {
    // Inserção guardada pelo índice único (coupon, user): conflito → já resgatado.
    const inserted = await this.db
      .insert(couponRedemptions)
      .values({ couponId, userId })
      .onConflictDoNothing()
      .returning({ id: couponRedemptions.id });
    if (inserted.length === 0) return false;
    // Incremento atômico de `usos_count` só quando o resgate é novo.
    await this.db
      .update(coupons)
      .set({ usosCount: sql`${coupons.usosCount} + 1` })
      .where(eq(coupons.id, couponId));
    return true;
  }
}
