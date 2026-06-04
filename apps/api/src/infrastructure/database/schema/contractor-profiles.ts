import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { contractorPlanEnum } from "./enums.js";

/** Perfil do contratante (roadmap §4.1). 1:1 com `users`. */
export const contractorProfiles = pgTable("contractor_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  plano: contractorPlanEnum("plano").notNull().default("BASICO"),
  planoExpiraEm: timestamp("plano_expira_em", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});
