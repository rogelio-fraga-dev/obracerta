import { pgTable, uuid, varchar, jsonb, timestamp, index, unique } from "drizzle-orm/pg-core";

/**
 * Eventos de webhook do gateway (roadmap §7.1 — "webhooks idempotentes"). Cada
 * evento do provedor é registrado UMA vez: o UNIQUE(gateway, event_id) é a chave de
 * idempotência — reprocessar o mesmo webhook não duplica efeito. APPEND-ONLY.
 */
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gateway: varchar("gateway", { length: 20 }).notNull(),
    eventId: varchar("event_id", { length: 120 }).notNull(),
    tipo: varchar("tipo", { length: 60 }).notNull(),
    payload: jsonb("payload"),
    processadoEm: timestamp("processado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("payment_events_idempotency").on(t.gateway, t.eventId),
    index("payment_events_tipo_idx").on(t.tipo),
  ],
);
