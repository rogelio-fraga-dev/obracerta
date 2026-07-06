import {
  pgTable,
  uuid,
  varchar,
  char,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

/**
 * Endereços salvos do usuário (aba Endereços). Servem de atalho ao abrir obra/
 * pedido (bairro/cidade pré-preenchidos) e de referência de atendimento. `principal`
 * marca o endereço padrão (a aplicação garante um único por usuário).
 */
export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Nome curto do endereço (ex.: "Casa", "Obra da Vila Mariana"). */
    apelido: varchar("apelido", { length: 40 }).notNull(),
    /** CEP só com dígitos (8). */
    cep: char("cep", { length: 8 }).notNull(),
    logradouro: varchar("logradouro", { length: 200 }).notNull(),
    numero: varchar("numero", { length: 20 }),
    complemento: varchar("complemento", { length: 100 }),
    bairro: varchar("bairro", { length: 120 }),
    cidade: varchar("cidade", { length: 120 }).notNull(),
    uf: char("uf", { length: 2 }).notNull(),
    principal: boolean("principal").notNull().default(false),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("addresses_user_idx").on(t.userId),
    // No máximo UM principal por usuário — garantido pelo banco, não só pela
    // aplicação (corrida de dois setPrincipal não deixa 2 principais).
    uniqueIndex("addresses_one_principal_idx")
      .on(t.userId)
      .where(sql`${t.principal} = true`),
  ],
);
