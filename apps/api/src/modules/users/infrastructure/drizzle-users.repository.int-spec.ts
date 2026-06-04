import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { DrizzleUsersRepository } from "./drizzle-users.repository.js";

config({ path: "../../.env" });

/**
 * Teste de integração real contra o Postgres do Docker. Verifica que o adapter
 * Drizzle persiste e lê de verdade. Requer `pnpm docker:up`. Não roda no CI
 * (sem infra) — use `pnpm --filter @obracerta/api test:int`.
 */
describe("DrizzleUsersRepository (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const repo = new DrizzleUsersRepository(db);
  const whatsapp = `+5511${Date.now().toString().slice(-9)}`;

  afterAll(async () => {
    await db.delete(users).where(eq(users.whatsapp, whatsapp));
    await pool.end();
  });

  it("cria e recupera um usuário por WhatsApp e por id", async () => {
    const created = await repo.create({
      nomeCompleto: "Teste Integração",
      whatsapp,
      email: "teste@example.com",
      tipo: "PROFISSIONAL",
    });

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.status).toBe("ATIVO");
    expect(created).not.toHaveProperty("cpf");

    const byWhatsapp = await repo.findByWhatsapp(whatsapp);
    expect(byWhatsapp?.id).toBe(created.id);

    const byId = await repo.findById(created.id);
    expect(byId?.whatsapp).toBe(whatsapp);
  });

  it("retorna null quando não encontra", async () => {
    const missing = await repo.findByWhatsapp("+550000000000");
    expect(missing).toBeNull();
  });
});
