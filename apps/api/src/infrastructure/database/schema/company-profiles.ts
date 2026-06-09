import { pgTable, uuid, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

/**
 * Perfil de empresa (roadmap §8.6). 1:1 com `users` (tipo EMPRESA). Modelo
 * "1 admin": a conta é o administrador. CNPJ é único entre empresas (índice
 * parcial — só vale quando preenchido, já que o cadastro pode completar depois).
 */
export const companyProfiles = pgTable(
  "company_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    cnpj: varchar("cnpj", { length: 14 }),
    razaoSocial: varchar("razao_social", { length: 160 }),
    nomeFantasia: varchar("nome_fantasia", { length: 160 }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("company_cnpj_unique_idx").on(t.cnpj).where(sql`${t.cnpj} is not null`),
  ],
);
