import { pgTable, uuid, varchar, integer, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { bookingRequests } from "./booking-requests.js";

/**
 * Penalidades por recusa inválida / no-show / cancelamento tardio (roadmap §8).
 * APPEND-ONLY. `pontos` é o peso da escala (somado para gerar o nível atual);
 * a classificação de motivo e a escala vivem no domínio `decline-penalty`.
 *
 * `professional_id` em cascade (PII comportamental: LGPD — some com a conta);
 * `booking_id` em set null (penalidade sobrevive à remoção do pedido).
 */
export const penalties = pgTable(
  "penalties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookingRequests.id, { onDelete: "set null" }),
    motivo: varchar("motivo", { length: 80 }).notNull(),
    pontos: integer("pontos").notNull().default(1),
    detalhe: varchar("detalhe", { length: 300 }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("penalties_professional_idx").on(t.professionalId),
    index("penalties_booking_idx").on(t.bookingId),
    check("penalties_pontos_check", sql`${t.pontos} > 0`),
  ],
);
