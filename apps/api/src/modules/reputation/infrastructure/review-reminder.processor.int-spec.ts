import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or } from "drizzle-orm";
import { Pool } from "pg";
import type { Job } from "bullmq";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import { reviews } from "../../../infrastructure/database/schema/reviews.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { DrizzleBookingRepository } from "../../booking/infrastructure/drizzle-booking.repository.js";
import { computeExpiry } from "../../booking/domain/booking-state.js";
import type { ReviewReminderJobData } from "../../booking/application/review-reminder.scheduler.js";
import type { NotificationProvider } from "../../notifications/domain/notification.provider.js";
import { reviewDeadline } from "../domain/review-rules.js";
import { DrizzleReviewRepository } from "./drizzle-review.repository.js";
import { ReviewReminderProcessor } from "./review-reminder.processor.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 6.4 parte 3): o consumidor dos lembretes notifica SÓ quem
 * ainda não avaliou. Requer docker:up. Fora do CI.
 */
describe("ReviewReminderProcessor (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const bookingRepo = new DrizzleBookingRepository(db);
  const reviewRepo = new DrizzleReviewRepository(db);

  const enviados: string[] = [];
  const notifyStub: NotificationProvider = {
    sendOtp: () => Promise.resolve(),
    sendMessage: (to: string) => {
      enviados.push(to);
      return Promise.resolve();
    },
  };
  const processor = new ReviewReminderProcessor(reviewRepo, notifyStub);

  const sufixo = Date.now().toString().slice(-9);
  let contractorId = "";
  let professionalId = "";
  let bookingId = "";

  const fireFor = (userId: string, whatsapp: string): Promise<void> =>
    processor.process({
      data: { bookingId, userId, whatsapp, dia: 1 } satisfies ReviewReminderJobData,
    } as Job<ReviewReminderJobData>);

  beforeAll(async () => {
    const c = await usersRepo.create({
      nomeCompleto: "Contratante Rem",
      whatsapp: `+5551${sufixo}`,
      email: `c.rem.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    const p = await usersRepo.create({
      nomeCompleto: "Profissional Rem",
      whatsapp: `+5561${sufixo}`,
      email: `p.rem.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    contractorId = c.id;
    professionalId = p.id;
    const b = await bookingRepo.create({
      contractorId,
      professionalId,
      especialidade: "esp-rem",
      descricao: null,
      dataServico: "2026-11-01T14:00:00.000Z",
      expiraEm: computeExpiry(new Date()),
    });
    bookingId = b.id;
    // só o profissional avaliou
    await reviewRepo.create({
      bookingId,
      autorId: professionalId,
      alvoId: contractorId,
      papelAutor: "PROFISSIONAL",
      nota: 5,
      comentario: null,
      fotoUrl: null,
      prazoEm: reviewDeadline(new Date()).toISOString(),
    });
  });

  afterAll(async () => {
    await db.delete(reviews).where(eq(reviews.bookingId, bookingId));
    await db.delete(bookingRequests).where(eq(bookingRequests.id, bookingId));
    await db.delete(users).where(or(eq(users.id, contractorId), eq(users.id, professionalId)));
    await pool.end();
  });

  it("não notifica quem já avaliou", async () => {
    enviados.length = 0;
    await fireFor(professionalId, `+5561${sufixo}`);
    expect(enviados).toHaveLength(0);
  });

  it("notifica quem ainda não avaliou", async () => {
    enviados.length = 0;
    await fireFor(contractorId, `+5551${sufixo}`);
    expect(enviados).toEqual([`+5551${sufixo}`]);
  });
});
