import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { DrizzleReputationEventRepository } from "./drizzle-reputation-event.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 6.4 parte 2): trilha de reputação por-usuário (append-only).
 * Requer docker:up. Fora do CI.
 */
describe("DrizzleReputationEventRepository (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const repo = new DrizzleReputationEventRepository(db);
  const sufixo = Date.now().toString().slice(-9);
  let userId = "";

  beforeAll(async () => {
    const user = await usersRepo.create({
      nomeCompleto: "Trilha Rep",
      whatsapp: `+5550${sufixo}`,
      email: `trilha.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    userId = user.id;
  });

  afterAll(async () => {
    // reputation_events tem FK em cascade → some com o usuário
    await db.delete(users).where(eq(users.id, userId));
    await pool.end();
  });

  it("acrescenta eventos e lista do mais recente para o mais antigo", async () => {
    await repo.append({ userId, tipo: "AVALIACAO_REVELADA", referenciaId: "booking-1", dados: null });
    await repo.append({ userId, tipo: "BADGE_CONCEDIDO", referenciaId: "BEM_AVALIADO", dados: null });

    const eventos = await repo.listForUser(userId);
    expect(eventos).toHaveLength(2);
    expect(eventos[0]?.tipo).toBe("BADGE_CONCEDIDO"); // mais recente primeiro (seq desc)
    expect(eventos[1]?.tipo).toBe("AVALIACAO_REVELADA");
    expect(eventos[1]?.referenciaId).toBe("booking-1");
  });

  it("usuário sem eventos → lista vazia", async () => {
    expect(await repo.listForUser("00000000-0000-0000-0000-000000000000")).toEqual([]);
  });
});
