import { pgTable, uuid, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Profissionais da plataforma vinculados à equipe da empresa (roster). O vínculo
 * nasce **pendente** (`confirmado = false`): a empresa vê o roster inteiro, mas o
 * profissional só aparece no **perfil público** da empresa depois de **confirmar**
 * (opt-in — o consentimento é do profissional).
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
    confirmado: boolean("confirmado").notNull().default(false),
    confirmadoEm: timestamp("confirmado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("company_professionals_company_idx").on(t.companyId),
    index("company_professionals_professional_idx").on(t.professionalId),
    uniqueIndex("company_professionals_pair_idx").on(t.companyId, t.professionalId),
  ],
);
