import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { coupons } from "./coupons.js";

/**
 * Programa de indicação: quando alguém se cadastra com o código de outro usuário,
 * registra-se o par (indicador → indicado) e ambos ganham um cupom de recompensa.
 * `status`: PENDENTE (recém-criado) → RECOMPENSADO (cupons emitidos). Um indicado
 * só pode ter sido indicado uma vez (índice único).
 */
export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referredId: uuid("referred_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 16 }).notNull().default("RECOMPENSADO"),
    cupomIndicadorId: uuid("cupom_indicador_id").references(() => coupons.id, { onDelete: "set null" }),
    cupomIndicadoId: uuid("cupom_indicado_id").references(() => coupons.id, { onDelete: "set null" }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("referrals_referrer_idx").on(t.referrerId),
    uniqueIndex("referrals_referred_idx").on(t.referredId),
  ],
);
