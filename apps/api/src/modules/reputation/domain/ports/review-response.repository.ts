import type { ReviewResponse } from "@obracerta/shared";

/** Dados para registrar uma resposta a uma avaliação. */
export interface CreateResponseData {
  reviewId: string;
  autorId: string;
  texto: string;
}

/** Porta de saída do direito de resposta (1 por avaliação, garantido por UNIQUE). */
export interface ReviewResponseRepository {
  findByReview(reviewId: string): Promise<ReviewResponse | null>;
  create(data: CreateResponseData): Promise<ReviewResponse>;
}

export const REVIEW_RESPONSE_REPOSITORY = Symbol("REVIEW_RESPONSE_REPOSITORY");
