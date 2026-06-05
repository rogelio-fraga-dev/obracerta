import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { scheduleBlocks } from "../../../infrastructure/database/schema/schedule-blocks.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { projectCalendar } from "../domain/calendar.js";
import { DrizzleAvailabilityRepository } from "./drizzle-availability.repository.js";

config({ path: "../../.env" });

/**
 * Integração real contra o Postgres do Docker (Fatia 2.1). Exercita o ciclo
 * PUT grade (idempotente) → GET grade → projeção do calendário com bloqueio
 * real. Requer `pnpm docker:up`. Fora do CI: `pnpm --filter @obracerta/api test:int`.
 */
describe("DrizzleAvailabilityRepository (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const repo = new DrizzleAvailabilityRepository(db);
  const whatsapp = `+5511${Date.now().toString().slice(-9)}`;
  let professionalId = "";

  beforeAll(async () => {
    const user = await usersRepo.create({
      nomeCompleto: "Agenda Integração",
      whatsapp,
      email: "agenda@example.com",
      tipo: "PROFISSIONAL",
    });
    professionalId = user.id;
  });

  afterAll(async () => {
    // cascade (FK onDelete) limpa availability e schedule_blocks do profissional
    await db.delete(users).where(eq(users.id, professionalId));
    await pool.end();
  });

  it("substitui a grade de forma idempotente e lê ordenado", async () => {
    const grade = [
      { diaSemana: 3, horaInicio: "14:00", horaFim: "18:00" },
      { diaSemana: 1, horaInicio: "09:00", horaFim: "12:00" },
    ];
    const first = await repo.setAvailability(professionalId, grade);
    expect(first).toHaveLength(2);

    // rodar de novo (delete+insert) não duplica nem viola a UNIQUE
    const second = await repo.setAvailability(professionalId, grade);
    expect(second).toHaveLength(2);

    const read = await repo.getAvailability(professionalId);
    expect(read).toHaveLength(2);
    expect(read[0]?.diaSemana).toBe(1); // ordenado por dia/horário
    expect(read[1]?.diaSemana).toBe(3);
  });

  it("projeta o calendário a partir da grade real menos um bloqueio", async () => {
    await db.insert(scheduleBlocks).values({
      professionalId,
      inicio: new Date("2026-06-01T10:00:00.000Z"),
      fim: new Date("2026-06-01T11:00:00.000Z"),
      motivo: "obra",
    });

    const [slots, blocks] = await Promise.all([
      repo.getAvailability(professionalId),
      repo.listBlocks(professionalId),
    ]);
    expect(blocks).toHaveLength(1);

    const cal = projectCalendar(slots, blocks, new Date("2026-06-01T00:00:00.000Z"), 1);
    const segunda = cal.find((d) => d.data === "2026-06-01");
    expect(segunda?.janelas).toEqual([
      { horaInicio: "09:00", horaFim: "10:00" },
      { horaInicio: "11:00", horaFim: "12:00" },
    ]);
  });

  it("grade vazia limpa toda a disponibilidade", async () => {
    const result = await repo.setAvailability(professionalId, []);
    expect(result).toEqual([]);
    expect(await repo.getAvailability(professionalId)).toEqual([]);
  });
});
