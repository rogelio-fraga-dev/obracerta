import { pgTable, uuid, varchar, integer, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { professionalPlanEnum, subscriptionStatusEnum } from "./enums.js";

/**
 * Assinatura recorrente do profissional (roadmap §7.1/§19). `valor_centavos` é
 * inteiro (dinheiro nunca em float). `grace_until` = "7 dias de graça". `gateway_id`
 * é o id no provedor (Asaas) — preenchido após criar a assinatura lá.
 *
 * `user_id` em RESTRICT: registro financeiro é evidência fiscal (não some por
 * cascade; contas usam soft-delete). Índice único parcial: no máximo UMA assinatura
 * vigente (não-cancelada) por usuário. Índice único parcial em (gateway, gateway_id)
 * mapeia webhooks de volta sem ambiguidade.
 */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    plano: professionalPlanEnum("plano").notNull(),
    status: subscriptionStatusEnum("status").notNull().default("EM_GRACA"),
    gateway: varchar("gateway", { length: 20 }).notNull(),
    gatewayId: varchar("gateway_id", { length: 64 }),
    valorCentavos: integer("valor_centavos").notNull(),
    graceUntil: timestamp("grace_until", { withTimezone: true }),
    proximaCobranca: timestamp("proxima_cobranca", { withTimezone: true }),
    canceladoEm: timestamp("cancelado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("subscriptions_user_idx").on(t.userId),
    uniqueIndex("subscriptions_one_active_per_user_idx")
      .on(t.userId)
      .where(sql`${t.status} <> 'CANCELADA'`),
    uniqueIndex("subscriptions_gateway_ref_idx")
      .on(t.gateway, t.gatewayId)
      .where(sql`${t.gatewayId} is not null`),
    check("subscriptions_valor_check", sql`${t.valorCentavos} > 0`),
  ],
);
