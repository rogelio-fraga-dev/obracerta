import { pgTable, uuid, varchar, timestamp, index, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { bookingRequests } from "./booking-requests.js";
import { userTipoEnum } from "./enums.js";

/**
 * Aceites de termo de ciência bilateral (roadmap §7.4/§9). APPEND-ONLY: o
 * repositório nunca atualiza nem apaga. Cada linha é prova jurídica e alimenta
 * o `audit_log` (hash-chain). `papel` identifica o lado (PROFISSIONAL/CONTRATANTE).
 *
 * FKs em RESTRICT: a evidência jurídica não pode ser destruída por cascade de
 * exclusão de pedido ou usuário (contas usam soft-delete). UNIQUE(booking,user)
 * impede aceite em duplicidade (retry/duplo-clique).
 */
export const termsAcceptances = pgTable(
  "terms_acceptances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookingRequests.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    papel: userTipoEnum("papel").notNull(),
    termoVersao: varchar("termo_versao", { length: 20 }).notNull(),
    ip: varchar("ip", { length: 45 }),
    aceitoEm: timestamp("aceito_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("terms_booking_idx").on(t.bookingId),
    unique("terms_one_per_user_per_booking").on(t.bookingId, t.userId),
  ],
);
