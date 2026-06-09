import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Portfólio de obras do profissional (roadmap §18). Galeria de fotos exibida no
 * perfil público. FK em CASCADE: as fotos pertencem ao profissional e somem com
 * a conta. Ordenadas por `criado_em` (mais recentes primeiro).
 */
export const portfolioPhotos = pgTable(
  "portfolio_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    professionalId: uuid("professional_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    legenda: varchar("legenda", { length: 140 }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("portfolio_professional_idx").on(t.professionalId)],
);
