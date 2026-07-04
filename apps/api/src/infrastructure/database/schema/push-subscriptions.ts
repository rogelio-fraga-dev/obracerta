import { pgTable, uuid, text, varchar, timestamp, index, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Inscrições de Web Push (PWA). Um usuário pode ter várias (celular + desktop).
 * `endpoint` é único globalmente (o browser gera); inscrição inválida (410 no
 * envio) é removida pelo serviço.
 */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: varchar("p256dh", { length: 255 }).notNull(),
    auth: varchar("auth", { length: 255 }).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("push_subscriptions_endpoint_unique").on(t.endpoint),
    index("push_subscriptions_user_idx").on(t.userId),
  ],
);
