import { pgTable, uuid, integer, text, varchar, timestamp, index, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { bookingRequests } from "./booking-requests.js";
import { userTipoEnum, reviewStatusEnum } from "./enums.js";

/**
 * Avaliação dupla-cega (roadmap §4.3/§12). Após um pedido CONCLUIDO, cada lado
 * avalia o outro. APPEND-ONLY: nota/comentário nunca são editados. Fica PENDENTE
 * (oculta) até ambos avaliarem (revelação simultânea) ou a janela de 7d fechar —
 * `prazo_em` é o instante usado pelo job de revelação. `papel_autor` diz quem
 * escreveu (PROFISSIONAL avalia CONTRATANTE e vice-versa).
 *
 * FKs em RESTRICT: avaliação é reputação durável (contas usam soft-delete), não
 * pode sumir por cascade. UNIQUE(booking, autor) impede avaliar o mesmo pedido
 * duas vezes. Índice parcial em PENDENTE alimenta a varredura de revelação.
 */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookingRequests.id, { onDelete: "restrict" }),
    autorId: uuid("autor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    alvoId: uuid("alvo_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    papelAutor: userTipoEnum("papel_autor").notNull(),
    nota: integer("nota").notNull(),
    comentario: text("comentario"),
    // Foto do serviço concluído anexada à avaliação (prova social). Opcional.
    fotoUrl: varchar("foto_url", { length: 500 }),
    status: reviewStatusEnum("status").notNull().default("PENDENTE"),
    prazoEm: timestamp("prazo_em", { withTimezone: true }).notNull(),
    reveladaEm: timestamp("revelada_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviews_alvo_idx").on(t.alvoId),
    index("reviews_booking_idx").on(t.bookingId),
    // só avaliações PENDENTE entram na varredura de revelação por janela
    index("reviews_pending_prazo_idx").on(t.prazoEm).where(sql`${t.status} = 'PENDENTE'`),
    unique("reviews_one_per_author_per_booking").on(t.bookingId, t.autorId),
    check("reviews_nota_check", sql`${t.nota} between 1 and 5`),
  ],
);
