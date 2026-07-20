import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";
import { userTypeSchema, reviewStatusSchema } from "./enums.js";

/**
 * Avaliação dupla-cega (roadmap §4.3/§12). Após um pedido CONCLUIDO, cada lado
 * avalia o outro dentro de uma janela de 7 dias. As notas ficam PENDENTE (ocultas)
 * até que ambos avaliem (revelação simultânea) ou a janela feche — só então viram
 * REVELADA. Uma avaliação é APPEND-ONLY: nota e comentário nunca são editados.
 * `papelAutor` identifica quem escreveu (PROFISSIONAL avalia CONTRATANTE e vice-versa).
 */

/** Nota de 1 a 5 estrelas. */
export const reviewRatingSchema = z.number().int().min(1).max(5);
export type ReviewRating = z.infer<typeof reviewRatingSchema>;

/** Uma avaliação (imutável). O comentário só é público quando `status = REVELADA`. */
export const reviewSchema = z.object({
  id: uuidSchema,
  bookingId: uuidSchema,
  autorId: uuidSchema,
  alvoId: uuidSchema,
  papelAutor: userTypeSchema,
  nota: reviewRatingSchema,
  comentario: z.string().trim().max(1000).nullable(),
  /** Foto do serviço concluído anexada pelo autor (prova social). Opcional. */
  fotoUrl: z.string().url().nullable(),
  status: reviewStatusSchema,
  prazoEm: isoTimestampSchema,
  reveladaEm: isoTimestampSchema.nullable(),
  criadoEm: isoTimestampSchema,
});
export type Review = z.infer<typeof reviewSchema>;

/**
 * Avaliação recebida (revelada) enriquecida com a **resposta pública** já publicada,
 * se houver. Permite à UI esconder o formulário de resposta quando já respondida
 * (sem refazer fetch por avaliação).
 */
export const receivedReviewSchema = reviewSchema.extend({
  resposta: z.string().nullable(),
  respostaEm: isoTimestampSchema.nullable(),
});
export type ReceivedReview = z.infer<typeof receivedReviewSchema>;

/** Indica se o usuário autenticado já avaliou um pedido (controla o form na tela do pedido). */
export const bookingReviewStatusSchema = z.object({ jaAvaliou: z.boolean() });
export type BookingReviewStatus = z.infer<typeof bookingReviewStatusSchema>;

/** Entrada para avaliar (o autor autenticado avalia a contraparte de um pedido). */
export const createReviewSchema = z.object({
  bookingId: uuidSchema,
  nota: reviewRatingSchema,
  comentario: z.string().trim().max(1000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/**
 * Direito de resposta pública (roadmap §4.3/§12): o avaliado responde à avaliação
 * já revelada. Máx. 1 resposta por avaliação, dentro de 30 dias (regra de domínio).
 */
export const reviewResponseSchema = z.object({
  id: uuidSchema,
  reviewId: uuidSchema,
  autorId: uuidSchema,
  texto: z.string().trim().min(3).max(1000),
  criadoEm: isoTimestampSchema,
});
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;

/** Entrada para responder a uma avaliação. */
export const createReviewResponseSchema = z.object({
  reviewId: uuidSchema,
  texto: z.string().trim().min(3).max(1000),
});
export type CreateReviewResponseInput = z.infer<typeof createReviewResponseSchema>;
