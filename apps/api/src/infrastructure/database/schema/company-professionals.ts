import { pgTable, uuid, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Profissionais da plataforma vinculados à equipe da empresa (roster interno —
 * homologação 18/07). Vínculo unilateral e privado: só a empresa vê o próprio
 * roster (exibição pública exigiria consentimento do profissional — evolução).
 */
export const companyProfessionals = pgTable(
  "company_professionals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("company_professionals_company_idx").on(t.companyId),
    uniqueIndex("company_professionals_pair_idx").on(t.companyId, t.professionalId),
  ],
);
