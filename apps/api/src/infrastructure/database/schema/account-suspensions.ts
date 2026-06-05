import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { reports } from "./reports.js";
import { suspensionStatusEnum } from "./enums.js";

/**
 * Suspensões de conta com direito de apelação (roadmap §13). Origem em denúncia
 * procedente (`report_id`) ou regra automática. `fim_em` nulo = indeterminada até
 * decisão; preenchido = suspensão temporária. A apelação registra texto + data e a
 * resolução move o `status` (REVOGADA/EXPIRADA).
 *
 * `user_id` em cascade (LGPD); `report_id` em SET NULL (a suspensão sobrevive à
 * remoção da denúncia de origem).
 */
export const accountSuspensions = pgTable(
  "account_suspensions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportId: uuid("report_id").references(() => reports.id, { onDelete: "set null" }),
    motivo: varchar("motivo", { length: 120 }).notNull(),
    status: suspensionStatusEnum("status").notNull().default("ATIVA"),
    inicioEm: timestamp("inicio_em", { withTimezone: true }).notNull().defaultNow(),
    fimEm: timestamp("fim_em", { withTimezone: true }),
    apelacaoTexto: text("apelacao_texto"),
    apeladaEm: timestamp("apelada_em", { withTimezone: true }),
    resolvidoEm: timestamp("resolvido_em", { withTimezone: true }),
  },
  (t) => [
    index("account_suspensions_user_idx").on(t.userId),
    // só suspensões em vigor (varredura de expiração / verificação no login)
    index("account_suspensions_active_idx").on(t.fimEm).where(sql`${t.status} = 'ATIVA'`),
  ],
);
