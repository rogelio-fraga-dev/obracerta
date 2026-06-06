import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { cities } from "./cities.js";
import { userTipoEnum, userStatusEnum } from "./enums.js";

/**
 * Usuário (roadmap §4.1). Identidade base; perfis (profissional/contratante)
 * ficam em tabelas próprias (fatia 1.2).
 *
 * LGPD (roadmap §9): `cpf` nunca é exposto em respostas públicas — o contrato
 * público `userSchema` (@obracerta/shared) não o inclui.
 *
 * Índice GIN trigram (`pg_trgm`) em `nome_completo` para a busca textual tolerante
 * a erro de digitação (roadmap §17, Fase 5) — acelera `ILIKE`/similaridade.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nomeCompleto: varchar("nome_completo", { length: 120 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 20 }).notNull().unique(),
    email: varchar("email", { length: 255 }),
    cidadeId: uuid("cidade_id").references(() => cities.id, { onDelete: "set null" }),
    tipo: userTipoEnum("tipo").notNull(),
    cpf: varchar("cpf", { length: 11 }),
    status: userStatusEnum("status").notNull().default("ATIVO"),
    // papéis administrativos (Fase 6); vazio = usuário comum. Catálogo no shared (UserRole).
    roles: text("roles").array().notNull().default([]),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_nome_trgm_idx").using("gin", sql`${t.nomeCompleto} gin_trgm_ops`)],
);
