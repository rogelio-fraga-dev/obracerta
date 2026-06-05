import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or, inArray } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import { reviews } from "../../../infrastructure/database/schema/reviews.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { DrizzleBookingRepository } from "../../booking/infrastructure/drizzle-booking.repository.js";
import { computeExpiry } from "../../booking/domain/booking-state.js";
import { reviewDeadline, averageRating } from "../domain/review-rules.js";
import { DrizzleReviewRepository } from "./drizzle-review.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 3.1): avaliação dupla-cega nasce PENDENTE; revela em par
 * (revelação simultânea) e por janela; média só conta as REVELADA. Requer docker:up. Fora do CI.
 */
describe("DrizzleReviewRepository (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const bookingRepo = new DrizzleBookingRepository(db);
  const repo = new DrizzleReviewRepository(db);
  const sufixo = Date.now().toString().slice(-9);
  let contractorId = "";
  let professionalId = "";
  let bookingPar = "";
  let bookingJanela = "";

  beforeAll(async () => {
    const contractor = await usersRepo.create({
      nomeCompleto: "Contratante Rep",
      whatsapp: `+5552${sufixo}`,
      email: `c.rep.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    const professional = await usersRepo.create({
      nomeCompleto: "Profissional Rep",
      whatsapp: `+5562${sufixo}`,
      email: `p.rep.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    contractorId = contractor.id;
    professionalId = professional.id;

    // dois pedidos concluídos: um para testar revelação em par, outro por janela
    for (const ref of ["par", "janela"] as const) {
      const b = await bookingRepo.create({
        contractorId,
        professionalId,
        especialidade: `esp-${ref}`,
        descricao: null,
        dataServico: "2026-11-01T14:00:00.000Z",
        expiraEm: computeExpiry(new Date()),
      });
      await bookingRepo.transitionStatus(b.id, "PENDENTE", "APROVADO");
      await bookingRepo.transitionStatus(b.id, "APROVADO", "INICIADO");
      await bookingRepo.transitionStatus(b.id, "INICIADO", "CONCLUIDO");
      if (ref === "par") bookingPar = b.id;
      else bookingJanela = b.id;
    }
  });

  afterAll(async () => {
    await db
      .delete(reviews)
      .where(inArray(reviews.bookingId, [bookingPar, bookingJanela].filter(Boolean)));
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

  const prazo = reviewDeadline(new Date()).toISOString();

  it("avaliação nasce PENDENTE (oculta)", async () => {
    const r = await repo.create({
      bookingId: bookingPar,
      autorId: contractorId,
      alvoId: professionalId,
      papelAutor: "CONTRATANTE",
      nota: 5,
      comentario: "Ótimo serviço",
      prazoEm: prazo,
    });
    expect(r.status).toBe("PENDENTE");
    expect(r.reveladaEm).toBeNull();
    expect(await repo.countForBooking(bookingPar)).toBe(1);
    // ainda não conta na reputação (não revelada)
    expect(await repo.revealedRatingsForTarget(professionalId)).toHaveLength(0);
  });

  it("revela em par quando ambos avaliam (revelação simultânea)", async () => {
    await repo.create({
      bookingId: bookingPar,
      autorId: professionalId,
      alvoId: contractorId,
      papelAutor: "PROFISSIONAL",
      nota: 4,
      comentario: null,
      prazoEm: prazo,
    });
    expect(await repo.countForBooking(bookingPar)).toBe(2);

    const revelados = await repo.revealPending(bookingPar);
    expect(revelados).toBe(2);
    // idempotente: revelar de novo não revela nada
    expect(await repo.revealPending(bookingPar)).toBe(0);

    const notasProf = await repo.revealedRatingsForTarget(professionalId);
    expect(notasProf).toEqual([5]);
    expect(averageRating(notasProf)).toBe(5);
  });

  it("revela por janela mesmo com só um lado avaliando", async () => {
    await repo.create({
      bookingId: bookingJanela,
      autorId: contractorId,
      alvoId: professionalId,
      papelAutor: "CONTRATANTE",
      nota: 3,
      comentario: "Ok",
      prazoEm: prazo,
    });
    // janela fechou: revela o que houver (1 avaliação)
    expect(await repo.revealPending(bookingJanela)).toBe(1);

    const notasProf = await repo.revealedRatingsForTarget(professionalId);
    expect(notasProf.sort()).toEqual([3, 5]);
    expect(averageRating(notasProf)).toBe(4);
    expect(await repo.listRevealedForTarget(professionalId)).toHaveLength(2);
  });
});
