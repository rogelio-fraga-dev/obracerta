import { pgTable, uuid, varchar, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { bookingRequests } from "./booking-requests.js";

/**
 * Bloqueios de período da agenda (roadmap §4.2/§10). Gerados automaticamente
 * quando um pedido é aprovado (bloqueio bilateral durante a obra) ou criados
 * manualmente. `booking_id` nulo = bloqueio manual; preenchido = derivado da obra.
 *
 * Dados operacionais (regeneráveis) → cascade. Constraints garantem intervalo
 * válido e que todo bloqueio manual tenha um motivo legível.
 */
export const scheduleBlocks = pgTable(
  "schedule_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookingRequests.id, { onDelete: "cascade" }),
    inicio: timestamp("inicio", { withTimezone: true }).notNull(),
    fim: timestamp("fim", { withTimezone: true }).notNull(),
    motivo: varchar("motivo", { length: 200 }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("schedule_blocks_professional_idx").on(t.professionalId, t.inicio),
    check("schedule_blocks_range_check", sql`${t.inicio} < ${t.fim}`),
    check(
      "schedule_blocks_motivo_check",
      sql`${t.bookingId} is not null or ${t.motivo} is not null`,
    ),
  ],
);
