import { Inject, Injectable } from "@nestjs/common";
import { count, eq, sql } from "drizzle-orm";
import type { Coupon, CouponType } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { referrals } from "../../../infrastructure/database/schema/referrals.js";
import type {
  CreateReferralData,
  ReferralsRepository,
} from "../domain/ports/referrals.repository.js";

/** Linha crua (snake_case) de `coupons` vinda de `db.execute` (sem mapeamento do Drizzle). */
interface RawCouponRow {
  id: string;
  codigo: string;
  descricao: string | null;
  tipo: string;
  valor: number;
  valido_ate: Date | string | null;
  usos_max: number | null;
  usos_count: number;
  ativo: boolean;
  criado_em: Date | string;
}

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

function rawToCoupon(row: RawCouponRow): Coupon {
  return {
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao,
    tipo: row.tipo as CouponType,
    valor: row.valor,
    validoAte: row.valido_ate ? toIso(row.valido_ate) : null,
    usosMax: row.usos_max,
    usosCount: row.usos_count,
    ativo: row.ativo,
    criadoEm: toIso(row.criado_em),
  };
}

@Injectable()
export class DrizzleReferralsRepository implements ReferralsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateReferralData): Promise<void> {
    await this.db
      .insert(referrals)
      .values({
        referrerId: data.referrerId,
        referredId: data.referredId,
        cupomIndicadorId: data.cupomIndicadorId,
        cupomIndicadoId: data.cupomIndicadoId,
      })
      .onConflictDoNothing();
  }

  async countByReferrer(referrerId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId));
    return row?.total ?? 0;
  }

  async referredExists(referredId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: referrals.id })
      .from(referrals)
      .where(eq(referrals.referredId, referredId))
      .limit(1);
    return row !== undefined;
  }

  /**
   * Cupons de recompensa do usuário (como indicador OU indicado) que ainda não
   * foram resgatados por ele. Junta `referrals` → `coupons` pelos dois lados e
   * exclui os já presentes em `coupon_redemptions` do próprio usuário.
   */
  async listMyRewardCoupons(userId: string): Promise<Coupon[]> {
    const res = await this.db.execute(sql`
      select c.*
      from referrals rf
      join coupons c on c.id = case
        when rf.referrer_id = ${userId} then rf.cupom_indicador_id
        when rf.referred_id = ${userId} then rf.cupom_indicado_id
      end
      where (rf.referrer_id = ${userId} or rf.referred_id = ${userId})
        and c.ativo = true
        and not exists (
          select 1 from coupon_redemptions cr
          where cr.coupon_id = c.id and cr.user_id = ${userId}
        )
      order by c.criado_em desc
    `);
    return (res.rows as unknown as RawCouponRow[]).map(rawToCoupon);
  }
}
