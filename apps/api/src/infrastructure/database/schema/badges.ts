import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

/**
 * Selos conquistados pelo usuário (roadmap §4.3/§12). `codigo` é o catálogo de
 * domínio (string livre, como `penalties.motivo`) para evoluir badges sem migration.
 * Um selo fica ativo enquanto `revogado_em` for nulo — o índice único parcial
 * garante no máximo um selo ATIVO de cada código por usuário (permite reconquista).
 *
 * `user_id` em cascade: selo é PII de reputação do usuário (LGPD — some com a conta).
 */
export const badges = pgTable(
  "badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codigo: varchar("codigo", { length: 40 }).notNull(),
    concedidoEm: timestamp("concedido_em", { withTimezone: true }).notNull().defaultNow(),
    revogadoEm: timestamp("revogado_em", { withTimezone: true }),
  },
  (t) => [
    index("badges_user_idx").on(t.userId),
    uniqueIndex("badges_one_active_per_code_idx")
      .on(t.userId, t.codigo)
      .where(sql`${t.revogadoEm} is null`),
  ],
);
