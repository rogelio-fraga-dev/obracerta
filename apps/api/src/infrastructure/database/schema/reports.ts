import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { reportStatusEnum } from "./enums.js";

/**
 * Denúncias de moderação (roadmap §13). Uma denúncia procedente oculta o conteúdo
 * por 48h e pode disparar suspensão. `entidade` + `entidade_id` apontam o alvo de
 * forma genérica (REVIEW/USER/PROFILE), no mesmo padrão do `audit_log`. `motivo` é
 * catálogo de domínio (string livre).
 *
 * `denunciante_id` em SET NULL: a denúncia sobrevive à remoção do denunciante
 * (preserva a trilha de moderação mesmo após LGPD da conta de origem).
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    denuncianteId: uuid("denunciante_id").references(() => users.id, { onDelete: "set null" }),
    entidade: varchar("entidade", { length: 20 }).notNull(),
    entidadeId: varchar("entidade_id", { length: 64 }).notNull(),
    motivo: varchar("motivo", { length: 80 }).notNull(),
    detalhe: text("detalhe"),
    status: reportStatusEnum("status").notNull().default("ABERTA"),
    resolvidoEm: timestamp("resolvido_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reports_entidade_idx").on(t.entidade, t.entidadeId),
    // fila de moderação: só denúncias ainda abertas
    index("reports_open_idx").on(t.criadoEm).where(sql`${t.status} = 'ABERTA'`),
  ],
);
