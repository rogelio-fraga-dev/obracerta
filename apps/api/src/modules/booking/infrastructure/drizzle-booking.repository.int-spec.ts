import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { DrizzleAvailabilityRepository } from "../../availability/infrastructure/drizzle-availability.repository.js";
import { computeExpiry, serviceBlockWindow } from "../domain/booking-state.js";
import { DrizzleBookingRepository } from "./drizzle-booking.repository.js";

config({ path: "../../.env" });

/**
 * Integração real contra o Postgres do Docker (Fatia 2.2). Cobre o ciclo do
 * pedido (criar → contar pendentes → transição guardada) e o bloqueio bilateral
 * (criar/remover por booking). Requer `pnpm docker:up`. Fora do CI.
 */
describe("DrizzleBookingRepository (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const repo = new DrizzleBookingRepository(db);
  const availability = new DrizzleAvailabilityRepository(db);
  const sufixo = Date.now().toString().slice(-9);
  let contractorId = "";
  let professionalId = "";

  beforeAll(async () => {
    const contractor = await usersRepo.create({
      nomeCompleto: "Contratante Booking",
      whatsapp: `+5511${sufixo}`,
      email: `contratante.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    const professional = await usersRepo.create({
      nomeCompleto: "Profissional Booking",
      whatsapp: `+5521${sufixo}`,
      email: `profissional.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    contractorId = contractor.id;
    professionalId = professional.id;
  });

  afterAll(async () => {
    // FKs do booking são RESTRICT: apagar os pedidos antes dos usuários.
    await db
      .delete(bookingRequests)
      .where(
        or(
          eq(bookingRequests.contractorId, contractorId),
          eq(bookingRequests.professionalId, professionalId),
        ),
      );
    await db.delete(users).where(or(eq(users.id, contractorId), eq(users.id, professionalId)));
    await pool.end();
  });

  it("cria pedido, conta pendentes e faz transição guardada", async () => {
    const dataServico = "2026-09-01T14:00:00.000Z";
    const booking = await repo.create({
      contractorId,
      professionalId,
      especialidade: "pintura",
      descricao: "pintar a sala",
      dataServico,
      expiraEm: computeExpiry(new Date()),
    });
    expect(booking.status).toBe("PENDENTE");

    expect(await repo.countPending(contractorId, "pintura")).toBe(1);
    expect(await repo.countPending(contractorId, "eletrica")).toBe(0);

    // transição guardada: PENDENTE → APROVADO
    const aprovado = await repo.transitionStatus(booking.id, "PENDENTE", "APROVADO");
    expect(aprovado?.status).toBe("APROVADO");

    // repetir a mesma transição não pega mais (status já não é PENDENTE)
    const denovo = await repo.transitionStatus(booking.id, "PENDENTE", "APROVADO");
    expect(denovo).toBeNull();

    // aprovado sai da contagem de pendentes
    expect(await repo.countPending(contractorId, "pintura")).toBe(0);

    // aparece nas duas listagens
    expect((await repo.listForProfessional(professionalId)).some((b) => b.id === booking.id)).toBe(
      true,
    );
    expect((await repo.listForContractor(contractorId)).some((b) => b.id === booking.id)).toBe(true);

    // bloqueio bilateral: criar pelo booking e remover
    const { inicio, fim } = serviceBlockWindow(dataServico);
    await availability.createBlock({ professionalId, inicio, fim, bookingId: booking.id, motivo: null });
    expect((await availability.listBlocks(professionalId)).length).toBe(1);
    await availability.deleteBlocksForBooking(booking.id);
    expect((await availability.listBlocks(professionalId)).length).toBe(0);
  });

  it("propõe, aplica e limpa um reagendamento (overlay sobre APROVADO)", async () => {
    const dataServico = "2026-10-01T14:00:00.000Z";
    const booking = await repo.create({
      contractorId,
      professionalId,
      especialidade: "reagenda",
      descricao: null,
      dataServico,
      expiraEm: computeExpiry(new Date()),
    });
    await repo.transitionStatus(booking.id, "PENDENTE", "APROVADO");

    // propor: registra a data proposta + quem propôs, sem mudar a data ainda
    const novaData = "2026-10-05T10:00:00.000Z";
    const proposto = await repo.proposeReschedule(booking.id, novaData, contractorId);
    expect(proposto?.reagendamentoData).toBe(novaData);
    expect(proposto?.reagendamentoPor).toBe(contractorId);
    expect(proposto?.dataServico).toBe(dataServico);

    // aplicar: move a data do serviço e limpa a proposta
    const aplicado = await repo.applyReschedule(booking.id, novaData);
    expect(aplicado?.dataServico).toBe(novaData);
    expect(aplicado?.reagendamentoData).toBeNull();
    expect(aplicado?.reagendamentoPor).toBeNull();

    // limpar (recusa) sobre uma nova proposta
    await repo.proposeReschedule(booking.id, "2026-10-09T09:00:00.000Z", professionalId);
    const limpo = await repo.clearReschedule(booking.id);
    expect(limpo?.reagendamentoData).toBeNull();
    expect(limpo?.reagendamentoPor).toBeNull();
  });
});
