import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Membros da equipe da empresa (homologação 18/07 — evolução do 1-admin). O
 * administrador (conta EMPRESA) convida por e-mail; quando o e-mail casa com um
 * usuário da plataforma, `user_id` é vinculado e o membro passa a **agir pela
 * empresa** nas obras/relatórios (resolução no `company` module). Papel em
 * varchar (catálogo `CompanyMemberRole` no shared — evolui sem migração).
 */
export const companyMembers = pgTable(
  "company_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 120 }).notNull(),
    email: varchar("email", { length: 160 }).notNull(),
    papel: varchar("papel", { length: 20 }).notNull().default("GESTOR"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("company_members_company_idx").on(t.companyId),
    index("company_members_user_idx").on(t.userId),
    // Um e-mail entra uma vez por empresa (re-convite atualiza, não duplica).
    uniqueIndex("company_members_company_email_idx").on(t.companyId, t.email),
  ],
);
