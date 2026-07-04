import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { workOrders } from "./work-orders.js";

/**
 * Galeria de fotos da obra (até 6 por obra — limite na aplicação). A primeira
 * foto também espelha em `work_orders.foto_url` (thumbnail da lista).
 */
export const workOrderPhotos = pgTable(
  "work_order_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workOrderId: uuid("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("work_order_photos_order_idx").on(t.workOrderId, t.criadoEm)],
);
