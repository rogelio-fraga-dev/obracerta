import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { bookingRequests } from "./booking-requests.js";

/**
 * Chat do pedido (pós-aceite): mensagens entre contratante e profissional,
 * centralizadas no pedido — a conversa fica junto do serviço, não espalhada
 * no WhatsApp. Liberado só depois do aceite (double-blind §24 preservado).
 */
export const bookingMessages = pgTable(
  "booking_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookingRequests.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    texto: varchar("texto", { length: 2000 }).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("booking_messages_booking_idx").on(t.bookingId, t.criadoEm)],
);
