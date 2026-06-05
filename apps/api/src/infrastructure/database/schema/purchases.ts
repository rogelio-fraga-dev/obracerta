import { pgTable, uuid, varchar, integer, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { contractorPlanEnum, purchaseStatusEnum } from "./enums.js";

/**
 * Compra avulsa do contratante (roadmap §7.1/§19) — SEM recorrência. `expira_em`
 * marca o fim da vigência do plano avulso. `valor_centavos` inteiro. `user_id` em
 * RESTRICT (evidência fiscal). Índice único parcial em (gateway, gateway_id) mapeia webhooks.
 */
export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    plano: contractorPlanEnum("plano").notNull(),
    status: purchaseStatusEnum("status").notNull().default("PENDENTE"),
    gateway: varchar("gateway", { length: 20 }).notNull(),
    gatewayId: varchar("gateway_id", { length: 64 }),
    valorCentavos: integer("valor_centavos").notNull(),
    expiraEm: timestamp("expira_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("purchases_user_idx").on(t.userId),
    uniqueIndex("purchases_gateway_ref_idx")
      .on(t.gateway, t.gatewayId)
      .where(sql`${t.gatewayId} is not null`),
    check("purchases_valor_check", sql`${t.valorCentavos} > 0`),
  ],
);
