import type { Review, UserType } from "@obracerta/shared";

/** Dados para registrar uma avaliação (nasce PENDENTE; prazo já calculado). */
export interface CreateReviewData {
  bookingId: string;
  autorId: string;
  alvoId: string;
  papelAutor: UserType;
  nota: number;
  comentario: string | null;
  prazoEm: string; // ISO
}

/**
 * Porta de saída das avaliações (append-only) + revelação e agregados.
 * A revelação (`revealPending`) é a única "escrita de estado": move PENDENTE →
 * REVELADA carimbando `revelada_em`; nota e comentário nunca mudam.
 */
export interface ReviewRepository {
  create(data: CreateReviewData): Promise<Review>;
  findById(id: string): Promise<Review | null>;
  findByBookingAndAuthor(bookingId: string, autorId: string): Promise<Review | null>;
  /** Nº de avaliações já registradas no pedido (1 ou 2). */
  countForBooking(bookingId: string): Promise<number>;
  /** Revela as avaliações PENDENTE de um pedido; devolve os alvoIds revelados. Idempotente. */
  revealPending(bookingId: string): Promise<string[]>;
  /** Notas das avaliações REVELADA sobre um alvo (para a média de reputação). */
  revealedRatingsForTarget(alvoId: string): Promise<number[]>;
  /** Avaliações REVELADA sobre um alvo (listagem pública). */
  listRevealedForTarget(alvoId: string): Promise<Review[]>;
}

export const REVIEW_REPOSITORY = Symbol("REVIEW_REPOSITORY");
