import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Tickets de suporte (central de ajuda): o usuário abre um chamado, o admin
 * responde pelo painel. Status simples: ABERTO → RESPONDIDO → FECHADO.
 */
export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Categoria do chamado (CONTA, PEDIDO, OBRA, PAGAMENTO, DENUNCIA, OUTRO). */
    categoria: varchar("categoria", { length: 30 }).notNull(),
    assunto: varchar("assunto", { length: 140 }).notNull(),
    mensagem: text("mensagem").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("ABERTO"),
    resposta: text("resposta"),
    respondidoEm: timestamp("respondido_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("support_tickets_user_idx").on(t.userId, t.criadoEm),
    index("support_tickets_status_idx").on(t.status),
  ],
);
