import { Inject, Injectable } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import type { ReviewResponse } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { reviewResponses } from "../../../infrastructure/database/schema/review-responses.js";
import type {
  CreateResponseData,
  ReviewResponseRepository,
} from "../domain/ports/review-response.repository.js";

type ResponseRow = typeof reviewResponses.$inferSelect;

export function rowToResponse(row: ResponseRow): ReviewResponse {
  return {
    id: row.id,
    reviewId: row.reviewId,
    autorId: row.autorId,
    texto: row.texto,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleReviewResponseRepository implements ReviewResponseRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findByReview(reviewId: string): Promise<ReviewResponse | null> {
    const [row] = await this.db
      .select()
      .from(reviewResponses)
      .where(eq(reviewResponses.reviewId, reviewId))
      .limit(1);
    return row ? rowToResponse(row) : null;
  }

  async findByReviews(reviewIds: string[]): Promise<ReviewResponse[]> {
    if (reviewIds.length === 0) return [];
    const rows = await this.db
      .select()
      .from(reviewResponses)
      .where(inArray(reviewResponses.reviewId, reviewIds));
    return rows.map(rowToResponse);
  }

  async create(data: CreateResponseData): Promise<ReviewResponse> {
    const [row] = await this.db
      .insert(reviewResponses)
      .values({ reviewId: data.reviewId, autorId: data.autorId, texto: data.texto })
      .returning();
    if (!row) throw new Error("Falha ao registrar a resposta.");
    return rowToResponse(row);
  }
}
