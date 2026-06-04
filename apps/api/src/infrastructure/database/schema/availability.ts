import { pgTable, uuid, integer, varchar, timestamp, index, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

/**
 * Grade semanal recorrente de disponibilidade do profissional (roadmap §4.2/§10).
 * Cada linha é uma faixa (dia da semana 0–6 + janela HH:MM). O calendário de
 * 6 meses é PROJETADO a partir daqui no domínio — não materializado em tabela.
 *
 * Constraints de integridade no próprio banco (não só no Zod), porque o seed,
 * migrations e ferramentas administrativas escrevem direto, sem passar pelo Zod.
 */
export const availability = pgTable(
  "availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    diaSemana: integer("dia_semana").notNull(),
    horaInicio: varchar("hora_inicio", { length: 5 }).notNull(),
    horaFim: varchar("hora_fim", { length: 5 }).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("availability_professional_idx").on(t.professionalId),
    // grade idempotente: substituir a semana não pode duplicar faixas
    unique("availability_unique_slot").on(t.professionalId, t.diaSemana, t.horaInicio, t.horaFim),
    check("availability_dia_semana_check", sql`${t.diaSemana} between 0 and 6`),
    // HH:MM zero-padded → comparação lexicográfica é correta
    check("availability_hora_check", sql`${t.horaInicio} < ${t.horaFim}`),
  ],
);
