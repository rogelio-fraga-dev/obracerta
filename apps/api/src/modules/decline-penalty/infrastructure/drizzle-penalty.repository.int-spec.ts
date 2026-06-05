import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import { penalties } from "../../../infrastructure/database/schema/penalties.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { DrizzleBookingRepository } from "../../booking/infrastructure/drizzle-booking.repository.js";
import { computeExpiry } from "../../booking/domain/booking-state.js";
import { computeAcceptanceRate, escalatePoints, PenaltyReason } from "../domain/penalty-rules.js";
import { DrizzlePenaltyRepository } from "./drizzle-penalty.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 2.4): registro de penalidade com escala + agregados de
 * comportamento (taxa de aceitação lendo booking_requests). Requer docker:up. Fora do CI.
 */
describe("DrizzlePenaltyRepository (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const bookingRepo = new DrizzleBookingRepository(db);
  const repo = new DrizzlePenaltyRepository(db);
  const sufixo = Date.now().toString().slice(-9);
  let contractorId = "";
  let professionalId = "";

  beforeAll(async () => {
    const contractor = await usersRepo.create({
      nomeCompleto: "Contratante Pen",
      whatsapp: `+5551${sufixo}`,
      email: `c.pen.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    const professional = await usersRepo.create({
      nomeCompleto: "Profissional Pen",
      whatsapp: `+5561${sufixo}`,
      email: `p.pen.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    contractorId = contractor.id;
    professionalId = professional.id;

    // 4 pedidos com desfechos: 2 aprovados, 1 recusado, 1 expirado
    const desfechos = ["APROVADO", "APROVADO", "RECUSADO", "EXPIRADO"] as const;
    for (const [i, status] of desfechos.entries()) {
      const b = await bookingRepo.create({
        contractorId,
        professionalId,
        especialidade: `esp-${i}`,
        descricao: null,
        dataServico: "2026-11-01T14:00:00.000Z",
        expiraEm: computeExpiry(new Date()),
      });
      await bookingRepo.transitionStatus(b.id, "PENDENTE", status);
    }
  });

  afterAll(async () => {
    await db.delete(penalties).where(eq(penalties.professionalId, professionalId));
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

  it("agrega desfechos e calcula a taxa de aceitação", async () => {
    const counts = await repo.bookingCounts(professionalId);
    expect(counts).toEqual({ total: 4, aprovados: 2, recusados: 1, expirados: 1 });
    expect(computeAcceptanceRate(counts.aprovados, counts.recusados, counts.expirados)).toBeCloseTo(
      0.5,
    );
  });

  it("registra penalidades com escala por reincidência e soma pontos", async () => {
    // 1ª recusa injustificada (prior 0 → 1pt)
    const prior1 = await repo.countForProfessional(professionalId);
    await repo.create({
      professionalId,
      bookingId: null,
      motivo: PenaltyReason.RECUSA_INJUSTIFICADA,
      pontos: escalatePoints(PenaltyReason.RECUSA_INJUSTIFICADA, prior1),
      detalhe: null,
    });

    // 2ª recusa (prior 1 → 2pts)
    const prior2 = await repo.countForProfessional(professionalId);
    await repo.create({
      professionalId,
      bookingId: null,
      motivo: PenaltyReason.RECUSA_INJUSTIFICADA,
      pontos: escalatePoints(PenaltyReason.RECUSA_INJUSTIFICADA, prior2),
      detalhe: null,
    });

    expect(await repo.countForProfessional(professionalId)).toBe(2);
    expect(await repo.sumPoints(professionalId)).toBe(3); // 1 + 2
    expect(await repo.listForProfessional(professionalId)).toHaveLength(2);
  });
});
