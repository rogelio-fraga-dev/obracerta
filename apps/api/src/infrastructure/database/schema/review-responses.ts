import { pgTable, uuid, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { reviews } from "./reviews.js";

/**
 * Direito de resposta pública (roadmap §4.3/§12). O avaliado responde à avaliação
 * já revelada — no máximo 1 por avaliação (a janela de 30 dias é regra de domínio).
 *
 * `review_id` em cascade: a resposta é dependente da avaliação (que nunca é
 * apagada de fato). `autor_id` em RESTRICT preserva o vínculo de autoria.
 */
export const reviewResponses = pgTable(
  "review_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    autorId: uuid("autor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    texto: text("texto").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("review_responses_review_idx").on(t.reviewId),
    unique("review_responses_one_per_review").on(t.reviewId),
  ],
);
