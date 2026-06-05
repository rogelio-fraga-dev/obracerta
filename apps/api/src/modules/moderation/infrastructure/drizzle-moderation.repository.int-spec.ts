import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or, inArray } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import { reviews } from "../../../infrastructure/database/schema/reviews.js";
import { reports } from "../../../infrastructure/database/schema/reports.js";
import { accountSuspensions } from "../../../infrastructure/database/schema/account-suspensions.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { DrizzleBookingRepository } from "../../booking/infrastructure/drizzle-booking.repository.js";
import { DrizzleReviewRepository } from "../../reputation/infrastructure/drizzle-review.repository.js";
import { computeExpiry } from "../../booking/domain/booking-state.js";
import { reviewDeadline } from "../../reputation/domain/review-rules.js";
import { suspensionEnd } from "../domain/moderation-rules.js";
import { DrizzleReportRepository } from "./drizzle-report.repository.js";
import { DrizzleSuspensionRepository } from "./drizzle-suspension.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 3.3): contagem cross-tabela de strikes procedentes
 * (denúncias diretas + avaliações que o ofensor escreveu) e ciclo de vida da
 * suspensão (criar/apelar/revogar). Requer docker:up. Fora do CI.
 */
describe("Moderação — reports e suspensões (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const bookingRepo = new DrizzleBookingRepository(db);
  const reviewRepo = new DrizzleReviewRepository(db);
  const reportRepo = new DrizzleReportRepository(db);
  const suspRepo = new DrizzleSuspensionRepository(db);
  const sufixo = Date.now().toString().slice(-9);
  let ofensorId = ""; // contratante que escreveu a avaliação ofensiva
  let alvoId = ""; // profissional avaliado
  let reviewId = "";

  beforeAll(async () => {
    const ofensor = await usersRepo.create({
      nomeCompleto: "Ofensor Mod",
      whatsapp: `+5554${sufixo}`,
      email: `o.mod.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    const alvo = await usersRepo.create({
      nomeCompleto: "Alvo Mod",
      whatsapp: `+5564${sufixo}`,
      email: `a.mod.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    ofensorId = ofensor.id;
    alvoId = alvo.id;

    const b = await bookingRepo.create({
      contractorId: ofensorId,
      professionalId: alvoId,
      especialidade: "esp-mod",
      descricao: null,
      dataServico: "2026-11-01T14:00:00.000Z",
      expiraEm: computeExpiry(new Date()),
    });
    await bookingRepo.transitionStatus(b.id, "PENDENTE", "APROVADO");
    await bookingRepo.transitionStatus(b.id, "APROVADO", "INICIADO");
    await bookingRepo.transitionStatus(b.id, "INICIADO", "CONCLUIDO");
    const review = await reviewRepo.create({
      bookingId: b.id,
      autorId: ofensorId,
      alvoId,
      papelAutor: "CONTRATANTE",
      nota: 1,
      comentario: "comentário ofensivo",
      prazoEm: reviewDeadline(new Date()).toISOString(),
    });
    await reviewRepo.revealPending(b.id);
    reviewId = review.id;
  });

  afterAll(async () => {
    await db.delete(accountSuspensions).where(eq(accountSuspensions.userId, ofensorId));
    await db.delete(reports).where(inArray(reports.entidadeId, [reviewId, ofensorId]));
    await db.delete(reviews).where(eq(reviews.id, reviewId));
    await db
      .delete(bookingRequests)
      .where(or(eq(bookingRequests.professionalId, alvoId), eq(bookingRequests.contractorId, ofensorId)));
    await db.delete(users).where(or(eq(users.id, alvoId), eq(users.id, ofensorId)));
    await pool.end();
  });

  it("conta strikes procedentes diretos (USER) e via avaliação autorada (REVIEW)", async () => {
    expect(await reportRepo.countProcedenteForOffender(ofensorId)).toBe(0);

    // strike 1: denúncia da avaliação que o ofensor escreveu (REVIEW → autor)
    const rReview = await reportRepo.create({
      denuncianteId: alvoId,
      entidade: "REVIEW",
      entidadeId: reviewId,
      motivo: "OFENSIVO",
      detalhe: null,
    });
    expect(await reportRepo.listOpen()).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: rReview.id, status: "ABERTA" })]),
    );
    await reportRepo.setStatus(rReview.id, "PROCEDENTE", true);

    // strikes 2 e 3: denúncias diretas ao usuário (USER)
    for (let i = 0; i < 2; i++) {
      const r = await reportRepo.create({
        denuncianteId: alvoId,
        entidade: "USER",
        entidadeId: ofensorId,
        motivo: "CONDUTA",
        detalhe: null,
      });
      await reportRepo.setStatus(r.id, "PROCEDENTE", true);
    }

    expect(await reportRepo.countProcedenteForOffender(ofensorId)).toBe(3);
  });

  it("ciclo da suspensão: criar → apelar → revogar", async () => {
    const susp = await suspRepo.create({
      userId: ofensorId,
      reportId: null,
      motivo: "Suspensão automática",
      fimEm: suspensionEnd(new Date()).toISOString(),
    });
    expect((await suspRepo.activeForUser(ofensorId))?.id).toBe(susp.id);

    const apelada = await suspRepo.appeal(susp.id, "Discordo da decisão, peço revisão.");
    expect(apelada?.status).toBe("APELADA");
    expect(apelada?.apeladaEm).not.toBeNull();
    // apelar de novo não acha mais uma ATIVA
    expect(await suspRepo.appeal(susp.id, "outra")).toBeNull();

    const revogada = await suspRepo.resolve(susp.id, "REVOGADA", true);
    expect(revogada?.status).toBe("REVOGADA");
    expect(await suspRepo.activeForUser(ofensorId)).toBeNull();
    expect(await suspRepo.listForUser(ofensorId)).toHaveLength(1);
  });
});
