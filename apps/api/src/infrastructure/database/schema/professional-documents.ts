import { pgTable, uuid, varchar, text, jsonb, integer, timestamp, index } from "drizzle-orm/pg-core";
import type { DocumentItem } from "@obracerta/shared";
import { users } from "./users.js";
import { documentTypeEnum } from "./enums.js";

/**
 * Documentos das ferramentas do profissional (roadmap §8.5): orçamentos e
 * recibos. Os itens ficam em `jsonb` (linhas de exibição); `total_centavos` é o
 * total derivado, recalculado no servidor a cada criação. FK em RESTRICT para
 * não apagar contas com histórico (mesma política dos pedidos).
 */
export const professionalDocuments = pgTable(
  "professional_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tipo: documentTypeEnum("tipo").notNull(),
    clienteNome: varchar("cliente_nome", { length: 120 }).notNull(),
    titulo: varchar("titulo", { length: 120 }).notNull(),
    observacoes: text("observacoes"),
    itens: jsonb("itens").$type<DocumentItem[]>().notNull(),
    totalCentavos: integer("total_centavos").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("prof_documents_professional_idx").on(t.professionalId)],
);
