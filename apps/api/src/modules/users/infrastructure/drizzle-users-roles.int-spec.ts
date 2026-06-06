import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { DrizzleUsersRepository } from "./drizzle-users.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 6.0): papéis administrativos do usuário (roles text[]).
 * Novo usuário nasce sem papéis; setRoles substitui o conjunto. Requer docker:up. Fora do CI.
 */
describe("DrizzleUsersRepository — roles (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const repo = new DrizzleUsersRepository(db);
  const sufixo = Date.now().toString().slice(-9);
  let userId = "";

  beforeAll(async () => {
    const user = await repo.create({
      nomeCompleto: "Admin Roles",
      whatsapp: `+5558${sufixo}`,
      email: `admin.roles.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    userId = user.id;
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, userId));
    await pool.end();
  });

  it("usuário novo nasce sem papéis", async () => {
    expect(await repo.findRoles(userId)).toEqual([]);
  });

  it("setRoles substitui o conjunto de papéis (idempotente)", async () => {
    await repo.setRoles(userId, ["MODERADOR", "FINANCEIRO"]);
    expect((await repo.findRoles(userId))?.sort()).toEqual(["FINANCEIRO", "MODERADOR"]);

    await repo.setRoles(userId, ["ADMIN"]);
    expect(await repo.findRoles(userId)).toEqual(["ADMIN"]);

    await repo.setRoles(userId, []);
    expect(await repo.findRoles(userId)).toEqual([]);
  });

  it("findRoles devolve null para usuário inexistente", async () => {
    expect(await repo.findRoles("00000000-0000-0000-0000-000000000000")).toBeNull();
  });
});
