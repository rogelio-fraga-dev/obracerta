import { pgTable, uuid, varchar, char, boolean, timestamp, unique } from "drizzle-orm/pg-core";

/**
 * Cidade como dimensão de 1ª classe (roadmap §4.1) — base da expansão
 * cidade-a-cidade. `ativa` controla onde o marketplace já opera.
 */
export const cities = pgTable(
  "cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: varchar("nome", { length: 120 }).notNull(),
    uf: char("uf", { length: 2 }).notNull(),
    ativa: boolean("ativa").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("cities_nome_uf_unique").on(table.nome, table.uf)],
);
