import { pgTable, uuid, varchar, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Preferências de notificação por categoria. O aviso in-app (sino + /notificacoes)
 * é sempre registrado; esta tabela controla apenas o **Web Push** por categoria
 * (`tipo` espelha o varchar de `notifications.tipo`). Ausência de linha = push
 * habilitado (padrão). PK composta (user + tipo): uma preferência por categoria.
 */
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tipo: varchar("tipo", { length: 30 }).notNull(),
    pushEnabled: boolean("push_enabled").notNull().default(true),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.tipo] })],
);
