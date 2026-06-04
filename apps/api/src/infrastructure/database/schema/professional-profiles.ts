import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { professionalPlanEnum } from "./enums.js";

/**
 * Perfil do profissional (roadmap §4.1). 1:1 com `users` (userId é PK e FK).
 * `especialidades` como text[] nativo do Postgres. A coluna `geo` (PostGIS) +
 * raio de atendimento entram na Fase 5 (busca geográfica) — adiada aqui.
 */
export const professionalProfiles = pgTable("professional_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  especialidades: text("especialidades").array().notNull().default([]),
  anosExperiencia: integer("anos_experiencia"),
  bairro: varchar("bairro", { length: 120 }),
  fotoUrl: varchar("foto_url", { length: 500 }),
  valores: text("valores"),
  formacaoDeclarada: varchar("formacao_declarada", { length: 200 }),
  completudePct: integer("completude_pct").notNull().default(0),
  plano: professionalPlanEnum("plano").notNull().default("INICIANTE"),
  slugPublico: varchar("slug_publico", { length: 80 }).notNull().unique(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});
