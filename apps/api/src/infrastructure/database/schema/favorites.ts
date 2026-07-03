import { pgTable, primaryKey, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Favoritos: contratante/empresa salva profissionais para contratar depois
 * (padrão do segmento — reduz o custo de redescobrir na busca). PK composta
 * evita duplicata; FKs em CASCADE somem com qualquer uma das contas.
 */
export const favorites = pgTable(
  "favorites",
  {
    /** Quem favoritou (contratante ou empresa). */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Profissional favoritado. */
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.professionalId] }),
    index("favorites_professional_idx").on(t.professionalId),
  ],
);
