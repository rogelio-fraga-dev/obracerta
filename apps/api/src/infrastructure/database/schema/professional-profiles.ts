import { pgTable, uuid, varchar, integer, text, timestamp, geometry, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { professionalPlanEnum } from "./enums.js";

/**
 * Perfil do profissional (roadmap §4.1). 1:1 com `users` (userId é PK e FK).
 * `especialidades` como text[] nativo do Postgres. `geo` (PostGIS point, SRID 4326)
 * + `raio_atendimento_km` habilitam a busca por raio (Fase 5); índice GIST acelera
 * a consulta geoespacial. (Coluna adiada da Fase 1.)
 */
export const professionalProfiles = pgTable(
  "professional_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    especialidades: text("especialidades").array().notNull().default([]),
    anosExperiencia: integer("anos_experiencia"),
    bairro: varchar("bairro", { length: 120 }),
    geo: geometry("geo", { type: "point", mode: "xy", srid: 4326 }),
    raioAtendimentoKm: integer("raio_atendimento_km"),
    fotoUrl: varchar("foto_url", { length: 500 }),
    valores: text("valores"),
    formacaoDeclarada: varchar("formacao_declarada", { length: 200 }),
    completudePct: integer("completude_pct").notNull().default(0),
    plano: professionalPlanEnum("plano").notNull().default("INICIANTE"),
    slugPublico: varchar("slug_publico", { length: 80 }).notNull().unique(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("professional_geo_idx").using("gist", t.geo),
    // GIN p/ filtro por especialidade (array contains `@>`) na busca (§17)
    index("professional_especialidades_idx").using("gin", t.especialidades),
  ],
);
