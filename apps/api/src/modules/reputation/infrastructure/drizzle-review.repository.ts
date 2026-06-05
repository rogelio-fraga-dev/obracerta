import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq } from "drizzle-orm";
import type { Review, UserType } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { reviews } from "../../../infrastructure/database/schema/reviews.js";
import type { CreateReviewData, ReviewRepository } from "../domain/ports/review.repository.js";

type ReviewRow = typeof reviews.$inferSelect;

export function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    bookingId: row.bookingId,
    autorId: row.autorId,
    alvoId: row.alvoId,
    papelAutor: row.papelAutor as UserType,
    nota: row.nota,
    comentario: row.comentario,
    status: row.status as Review["status"],
    prazoEm: row.prazoEm.toISOString(),
    reveladaEm: row.reveladaEm ? row.reveladaEm.toISOString() : null,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleReviewRepository implements ReviewRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateReviewData): Promise<Review> {
    const [row] = await this.db
      .insert(reviews)
      .values({
        bookingId: data.bookingId,
        autorId: data.autorId,
        alvoId: data.alvoId,
        papelAutor: data.papelAutor,
        nota: data.nota,
        comentario: data.comentario,
        prazoEm: new Date(data.prazoEm),
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar a avaliação.");
    return rowToReview(row);
  }

  async findById(id: string): Promise<Review | null> {
    const [row] = await this.db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    return row ? rowToReview(row) : null;
  }

  async findByBookingAndAuthor(bookingId: string, autorId: string): Promise<Review | null> {
    const [row] = await this.db
      .select()
      .from(reviews)
      .where(and(eq(reviews.bookingId, bookingId), eq(reviews.autorId, autorId)))
      .limit(1);
    return row ? rowToReview(row) : null;
  }

  async countForBooking(bookingId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId));
    return row?.total ?? 0;
  }

  async revealPending(bookingId: string): Promise<string[]> {
    const revealed = await this.db
      .update(reviews)
      .set({ status: "REVELADA", reveladaEm: new Date() })
      .where(and(eq(reviews.bookingId, bookingId), eq(reviews.status, "PENDENTE")))
      .returning({ alvoId: reviews.alvoId });
    return revealed.map((r) => r.alvoId);
  }

  async revealedRatingsForTarget(alvoId: string): Promise<number[]> {
    const rows = await this.db
      .select({ nota: reviews.nota })
      .from(reviews)
      .where(and(eq(reviews.alvoId, alvoId), eq(reviews.status, "REVELADA")));
    return rows.map((r) => r.nota);
  }

  async listRevealedForTarget(alvoId: string): Promise<Review[]> {
    const rows = await this.db
      .select()
      .from(reviews)
      .where(and(eq(reviews.alvoId, alvoId), eq(reviews.status, "REVELADA")))
      .orderBy(desc(reviews.reveladaEm));
    return rows.map(rowToReview);
  }
}
