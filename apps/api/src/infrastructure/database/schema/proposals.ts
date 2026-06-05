import { pgTable, uuid, integer, text, timestamp, index, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { workOrders } from "./work-orders.js";
import { proposalStatusEnum } from "./enums.js";

/**
 * Proposta/lance SIGILOSO de um profissional para uma obra (roadmap §16). A natureza
 * sigilosa é regra de acesso (visível só ao contratante dono da obra e ao próprio
 * autor — nunca entre concorrentes), não um campo. `valor_centavos` inteiro.
 *
 * `work_order_id` em CASCADE (lance é dependente da obra; dado operacional);
 * `professional_id` em RESTRICT. UNIQUE(obra, profissional): um lance por profissional
 * por obra (reenviar = atualizar, não empilhar).
 */
export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workOrderId: uuid("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    valorCentavos: integer("valor_centavos").notNull(),
    prazoDias: integer("prazo_dias"),
    mensagem: text("mensagem"),
    status: proposalStatusEnum("status").notNull().default("ENVIADA"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("proposals_work_order_idx").on(t.workOrderId),
    index("proposals_professional_idx").on(t.professionalId),
    unique("proposals_one_per_professional_per_order").on(t.workOrderId, t.professionalId),
    check("proposals_valor_check", sql`${t.valorCentavos} > 0`),
  ],
);
