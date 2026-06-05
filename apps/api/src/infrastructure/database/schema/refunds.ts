import { pgTable, uuid, varchar, integer, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { invoices } from "./invoices.js";
import { refundStatusEnum } from "./enums.js";

/**
 * Reembolso de uma fatura paga (roadmap §21 — 4 cenários CDC). `valor_centavos`
 * permite estorno parcial. Máquina de estados via `refund_status`. FKs em RESTRICT
 * (cadeia financeira é evidência; o estorno referencia a fatura paga).
 */
export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    valorCentavos: integer("valor_centavos").notNull(),
    motivo: varchar("motivo", { length: 120 }).notNull(),
    status: refundStatusEnum("status").notNull().default("SOLICITADO"),
    gatewayId: varchar("gateway_id", { length: 64 }),
    solicitadoEm: timestamp("solicitado_em", { withTimezone: true }).notNull().defaultNow(),
    processadoEm: timestamp("processado_em", { withTimezone: true }),
  },
  (t) => [
    index("refunds_invoice_idx").on(t.invoiceId),
    index("refunds_user_idx").on(t.userId),
    check("refunds_valor_check", sql`${t.valorCentavos} > 0`),
  ],
);
