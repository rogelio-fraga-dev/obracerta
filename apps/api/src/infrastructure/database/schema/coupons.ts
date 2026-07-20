import { pgTable, uuid, varchar, integer, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Cupons/promoções aplicáveis à assinatura. `tipo`: PERCENTUAL (% de desconto na
 * fatura), FIXO (centavos de desconto) ou DIAS_GRATIS (estende a graça/trial).
 * `usos_max` limita o total de resgates; `valido_ate` a validade. Cupons de
 * indicação são gerados automaticamente (ver `referrals`).
 */
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codigo: varchar("codigo", { length: 24 }).notNull(),
    descricao: varchar("descricao", { length: 160 }),
    tipo: varchar("tipo", { length: 16 }).notNull(), // PERCENTUAL | FIXO | DIAS_GRATIS
    valor: integer("valor").notNull(), // % (1..100) · centavos · dias
    validoAte: timestamp("valido_ate", { withTimezone: true }),
    usosMax: integer("usos_max"), // null = ilimitado
    usosCount: integer("usos_count").notNull().default(0),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("coupons_codigo_idx").on(t.codigo)],
);

/** Resgate de um cupom por um usuário — no máximo 1 vez por (cupom, usuário). */
export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("coupon_redemptions_user_idx").on(t.userId),
    uniqueIndex("coupon_redemptions_pair_idx").on(t.couponId, t.userId),
  ],
);
