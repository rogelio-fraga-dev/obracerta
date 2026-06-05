import { pgTable, uuid, varchar, integer, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { subscriptions } from "./subscriptions.js";
import { purchases } from "./purchases.js";
import { invoiceStatusEnum, paymentMethodEnum } from "./enums.js";

/**
 * Fatura/cobrança (roadmap §7.1) vinculada a EXATAMENTE uma origem: assinatura OU
 * compra (CHECK num_nonnulls = 1). Máquina de estados via `invoice_status`. `metodo`
 * é preenchido quando paga. `valor_centavos` inteiro.
 *
 * FKs em RESTRICT (cadeia financeira é evidência). Índice (status, vencimento) serve
 * à varredura de faturas vencidas; índice único parcial em (gateway, gateway_id) liga o webhook.
 */
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
      onDelete: "restrict",
    }),
    purchaseId: uuid("purchase_id").references(() => purchases.id, { onDelete: "restrict" }),
    gateway: varchar("gateway", { length: 20 }).notNull(),
    gatewayId: varchar("gateway_id", { length: 64 }),
    valorCentavos: integer("valor_centavos").notNull(),
    status: invoiceStatusEnum("status").notNull().default("PENDENTE"),
    metodo: paymentMethodEnum("metodo"),
    vencimentoEm: timestamp("vencimento_em", { withTimezone: true }).notNull(),
    pagoEm: timestamp("pago_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("invoices_user_idx").on(t.userId),
    index("invoices_subscription_idx").on(t.subscriptionId),
    index("invoices_due_idx").on(t.status, t.vencimentoEm),
    uniqueIndex("invoices_gateway_ref_idx")
      .on(t.gateway, t.gatewayId)
      .where(sql`${t.gatewayId} is not null`),
    check("invoices_valor_check", sql`${t.valorCentavos} > 0`),
    // exatamente uma origem: assinatura ou compra
    check(
      "invoices_one_origin_check",
      sql`num_nonnulls(${t.subscriptionId}, ${t.purchaseId}) = 1`,
    ),
  ],
);
