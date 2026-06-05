import { pgTable, uuid, varchar, jsonb, timestamp, bigserial, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Trilha de reputação do usuário (roadmap §4.3/§12). APPEND-ONLY: cada evento
 * (avaliação revelada, badge conquistado/revogado, denúncia procedente, suspensão)
 * é registrado e nunca alterado. `tipo` é catálogo de domínio (string livre, como
 * `audit_log.acao`); `referencia_id` aponta a avaliação/badge/denúncia de origem.
 * `seq` (bigserial) dá ordem total estável para reconstruir a linha do tempo.
 *
 * Diferente do `audit_log` (trilha global tamper-evident por hash-chain), esta é a
 * trilha por-usuário que alimenta o cálculo de reputação. `user_id` em cascade (LGPD).
 */
export const reputationEvents = pgTable(
  "reputation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seq: bigserial("seq", { mode: "number" }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tipo: varchar("tipo", { length: 60 }).notNull(),
    referenciaId: varchar("referencia_id", { length: 64 }),
    dados: jsonb("dados"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reputation_events_user_idx").on(t.userId, t.criadoEm)],
);
