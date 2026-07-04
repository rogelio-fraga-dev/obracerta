import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

/**
 * Notificações in-app (avisos e lembretes de engajamento): sino no shell +
 * página /notificacoes. Complementa o provedor externo (WhatsApp/console) —
 * o registro fica na plataforma mesmo se o canal externo falhar.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Categoria (ex.: PEDIDO, OBRA, AVALIACAO, COBRANCA, SISTEMA) — orienta ícone/rota. */
    tipo: varchar("tipo", { length: 30 }).notNull(),
    titulo: varchar("titulo", { length: 140 }).notNull(),
    corpo: varchar("corpo", { length: 500 }),
    /** Rota interna para onde a notificação leva (ex.: /pedidos/<id>). */
    link: varchar("link", { length: 300 }),
    lida: boolean("lida").notNull().default(false),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId, t.criadoEm),
    index("notifications_unread_idx").on(t.userId).where(sql`${t.lida} = false`),
  ],
);
