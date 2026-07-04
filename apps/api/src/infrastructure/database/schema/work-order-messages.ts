import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { workOrders } from "./work-orders.js";

/**
 * Chat da obra (pós-adjudicação): mensagens entre o dono da obra e o
 * profissional vencedor do lance — mesmo espírito do chat do pedido.
 */
export const workOrderMessages = pgTable(
  "work_order_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workOrderId: uuid("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    texto: varchar("texto", { length: 2000 }).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("work_order_messages_order_idx").on(t.workOrderId, t.criadoEm)],
);
