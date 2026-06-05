import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import { reviews } from "../../../infrastructure/database/schema/reviews.js";
import { badges } from "../../../infrastructure/database/schema/badges.js";
import { reviewResponses } from "../../../infrastructure/database/schema/review-responses.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { DrizzleBookingRepository } from "../../booking/infrastructure/drizzle-booking.repository.js";
import { computeExpiry } from "../../booking/domain/booking-state.js";
import { reviewDeadline } from "../domain/review-rules.js";
import { DrizzleReviewRepository } from "./drizzle-review.repository.js";
import { DrizzleBadgeRepository } from "./drizzle-badge.repository.js";
import { DrizzleReviewResponseRepository } from "./drizzle-review-response.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 3.2): badges (conceder/revogar/reconceder usando o índice
 * único parcial "um ativo por código") e direito de resposta (1 por avaliação,
 * garantido por UNIQUE). Requer docker:up. Fora do CI.
 */
describe("Reputação — badges e respostas (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const bookingRepo = new DrizzleBookingRepository(db);
  const reviewRepo = new DrizzleReviewRepository(db);
  const badgeRepo = new DrizzleBadgeRepository(db);
  const responseRepo = new DrizzleReviewResponseRepository(db);
  const sufixo = Date.now().toString().slice(-9);
  let contractorId = "";
  let professionalId = "";
  let reviewId = "";

  beforeAll(async () => {
    const contractor = await usersRepo.create({
      nomeCompleto: "Contratante Bdg",
      whatsapp: `+5553${sufixo}`,
      email: `c.bdg.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    const professional = await usersRepo.create({
      nomeCompleto: "Profissional Bdg",
      whatsapp: `+5563${sufixo}`,
      email: `p.bdg.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    contractorId = contractor.id;
    professionalId = professional.id;

    const b = await bookingRepo.create({
      contractorId,
      professionalId,
      especialidade: "esp-bdg",
      descricao: null,
      dataServico: "2026-11-01T14:00:00.000Z",
      expiraEm: computeExpiry(new Date()),
    });
    await bookingRepo.transitionStatus(b.id, "PENDENTE", "APROVADO");
    await bookingRepo.transitionStatus(b.id, "APROVADO", "INICIADO");
    await bookingRepo.transitionStatus(b.id, "INICIADO", "CONCLUIDO");
    const review = await reviewRepo.create({
      bookingId: b.id,
      autorId: contractorId,
      alvoId: professionalId,
      papelAutor: "CONTRATANTE",
      nota: 5,
      comentario: "Excelente",
      prazoEm: reviewDeadline(new Date()).toISOString(),
    });
    await reviewRepo.revealPending(b.id);
    reviewId = review.id;
  });

  afterAll(async () => {
    await db.delete(reviewResponses).where(eq(reviewResponses.reviewId, reviewId));
    await db.delete(reviews).where(eq(reviews.id, reviewId));
    await db.delete(badges).where(eq(badges.userId, professionalId));
    await db
      .delete(bookingRequests)
      .where(
        or(
          eq(bookingRequests.professionalId, professionalId),
          eq(bookingRequests.contractorId, contractorId),
        ),
      );
    await db.delete(users).where(or(eq(users.id, professionalId), eq(users.id, contractorId)));
    await pool.end();
  });

  it("concede, lista e revoga badges (e permite reconquista)", async () => {
    expect(await badgeRepo.listActiveCodes(professionalId)).toEqual([]);

    await badgeRepo.grant(professionalId, "BEM_AVALIADO");
    expect(await badgeRepo.listActiveCodes(professionalId)).toEqual(["BEM_AVALIADO"]);

    await badgeRepo.revoke(professionalId, "BEM_AVALIADO");
    expect(await badgeRepo.listActiveCodes(professionalId)).toEqual([]);

    // reconquista: índice único parcial permite nova linha ativa (a antiga foi revogada)
    await badgeRepo.grant(professionalId, "BEM_AVALIADO");
    expect(await badgeRepo.listActiveCodes(professionalId)).toEqual(["BEM_AVALIADO"]);
  });

  it("registra a resposta e impede a segunda (UNIQUE por avaliação)", async () => {
    expect(await responseRepo.findByReview(reviewId)).toBeNull();

    const resp = await responseRepo.create({
      reviewId,
      autorId: professionalId,
      texto: "Obrigado pelo feedback!",
    });
    expect(resp.reviewId).toBe(reviewId);
    expect(await responseRepo.findByReview(reviewId)).not.toBeNull();

    await expect(
      responseRepo.create({ reviewId, autorId: professionalId, texto: "Outra" }),
    ).rejects.toThrow();
  });
});
