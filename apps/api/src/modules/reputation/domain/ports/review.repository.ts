import type { Review, UserType } from "@obracerta/shared";

/** Dados para registrar uma avaliação (nasce PENDENTE; prazo já calculado). */
export interface CreateReviewData {
  bookingId: string;
  autorId: string;
  alvoId: string;
  papelAutor: UserType;
  nota: number;
  comentario: string | null;
  fotoUrl: string | null;
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
  /** Anexa a foto do serviço à avaliação do próprio autor. `null` se não for dele. */
  setFoto(reviewId: string, autorId: string, url: string): Promise<Review | null>;
  /** Nº de avaliações já registradas no pedido (1 ou 2). */
  countForBooking(bookingId: string): Promise<number>;
  /** Revela as avaliações PENDENTE de um pedido; devolve os alvoIds revelados. Idempotente. */
  revealPending(bookingId: string): Promise<string[]>;
  /** Oculta uma avaliação revelada (moderação). REVELADA → OCULTA. Idempotente. */
  hide(id: string): Promise<void>;
  /** Restaura uma avaliação oculta (moderação). OCULTA → REVELADA. Idempotente. */
  restore(id: string): Promise<void>;
  /** Notas das avaliações REVELADA sobre um alvo (para a média de reputação). */
  revealedRatingsForTarget(alvoId: string): Promise<number[]>;
  /** Avaliações REVELADA sobre um alvo (listagem pública). */
  listRevealedForTarget(alvoId: string): Promise<Review[]>;
}

export const REVIEW_REPOSITORY = Symbol("REVIEW_REPOSITORY");
