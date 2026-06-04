import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { cities } from "./cities.js";
import { userTipoEnum, userStatusEnum } from "./enums.js";

/**
 * Usuário (roadmap §4.1). Identidade base; perfis (profissional/contratante)
 * ficam em tabelas próprias (fatia 1.2).
 *
 * LGPD (roadmap §9): `cpf` nunca é exposto em respostas públicas — o contrato
 * público `userSchema` (@obracerta/shared) não o inclui.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomeCompleto: varchar("nome_completo", { length: 120 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  cidadeId: uuid("cidade_id").references(() => cities.id, { onDelete: "set null" }),
  tipo: userTipoEnum("tipo").notNull(),
  cpf: varchar("cpf", { length: 11 }),
  status: userStatusEnum("status").notNull().default("ATIVO"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});
