import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { bookingStatusEnum } from "./enums.js";

/**
 * Pedido de agendamento (roadmap §4.2/§7/§11). Máquina de estados via
 * `bookingStatusEnum`; `expira_em` é a janela de 24h aplicada por job BullMQ.
 *
 * FKs em RESTRICT: contas com pedidos/histórico nunca são apagadas em hard-delete
 * (usar soft-delete via `users.status = REMOVIDO`) — isso protege os termos e a
 * auditoria que dependem do pedido. Índices: listagem por profissional/contratante
 * + varredura de expiração (índice PARCIAL só em PENDENTE, onde o job atua).
 */
export const bookingRequests = pgTable(
  "booking_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractorId: uuid("contractor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    especialidade: varchar("especialidade", { length: 60 }).notNull(),
    descricao: text("descricao"),
    dataServico: timestamp("data_servico", { withTimezone: true }).notNull(),
    status: bookingStatusEnum("status").notNull().default("PENDENTE"),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    motivoRecusa: varchar("motivo_recusa", { length: 300 }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("booking_professional_idx").on(t.professionalId),
    index("booking_contractor_idx").on(t.contractorId),
    // só pedidos PENDENTE entram na varredura de expiração e na regra "máx 2/especialidade"
    index("booking_pending_expiry_idx").on(t.expiraEm).where(sql`${t.status} = 'PENDENTE'`),
    index("booking_pending_contractor_esp_idx")
      .on(t.contractorId, t.especialidade)
      .where(sql`${t.status} = 'PENDENTE'`),
  ],
);
