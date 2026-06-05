import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { professionalProfiles } from "../../../infrastructure/database/schema/professional-profiles.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { DrizzleProfilesRepository } from "../../profiles/infrastructure/drizzle-profiles.repository.js";
import { resolveRadiusKm } from "../domain/search-rules.js";
import { DrizzleSearchRepository } from "./drizzle-search.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 5.1): busca por especialidade + texto + geo (ST_DWithin
 * sobre o índice GIST, SRID 4326). Valida a coluna geo ponta a ponta (pendência da
 * 5.0). Requer docker:up. Fora do CI.
 */
describe("DrizzleSearchRepository (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const profilesRepo = new DrizzleProfilesRepository(db);
  const repo = new DrizzleSearchRepository(db);
  const sufixo = Date.now().toString().slice(-9);
  const especialidade = `esp-search-${sufixo}`; // isola o teste de outros perfis no banco
  // Uberlândia/MG e São Paulo/SP (~470 km de distância)
  const udi = { lat: -18.9186, lng: -48.2772 };
  const sp = { lat: -23.5505, lng: -46.6333 };
  let profId = "";

  beforeAll(async () => {
    const prof = await usersRepo.create({
      nomeCompleto: "João Eletricista Search",
      whatsapp: `+5556${sufixo}`,
      email: `joao.search.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    profId = prof.id;
    await profilesRepo.createProfessional(profId, `joao-search-${sufixo}`);
    await db.execute(sql`
      update professional_profiles
      set especialidades = ARRAY[${especialidade}]::text[],
          bairro = 'Centro',
          plano = 'PRO',
          anos_experiencia = 8,
          geo = ST_SetSRID(ST_MakePoint(${udi.lng}, ${udi.lat}), 4326)
      where user_id = ${profId}
    `);
  });

  afterAll(async () => {
    await db.delete(professionalProfiles).where(eq(professionalProfiles.userId, profId));
    await db.delete(users).where(eq(users.id, profId));
    await pool.end();
  });

  const base = { q: null, plano: null, geo: null, limit: 20, offset: 0 };

  it("encontra por especialidade (GIN @>)", async () => {
    const { items, total } = await repo.searchProfessionals({ ...base, especialidade });
    expect(total).toBe(1);
    expect(items[0]?.nome).toBe("João Eletricista Search");
    expect(items[0]?.especialidades).toContain(especialidade);
    expect(items[0]?.distanciaKm).toBeNull(); // sem geo na consulta
  });

  it("encontra no raio (ST_DWithin) com distância calculada", async () => {
    const { items, total } = await repo.searchProfessionals({
      ...base,
      especialidade,
      geo: { ...udi, raioKm: resolveRadiusKm(10) },
    });
    expect(total).toBe(1);
    expect(items[0]?.distanciaKm).not.toBeNull();
    expect(items[0]!.distanciaKm!).toBeLessThan(1); // praticamente no ponto
  });

  it("exclui fora do raio", async () => {
    const { total } = await repo.searchProfessionals({
      ...base,
      especialidade,
      geo: { ...sp, raioKm: resolveRadiusKm(10) }, // 10 km de SP não alcança Uberlândia
    });
    expect(total).toBe(0);
  });

  it("encontra por texto no nome (pg_trgm ILIKE)", async () => {
    const { items } = await repo.searchProfessionals({ ...base, especialidade, q: "joão elet" });
    expect(items).toHaveLength(1);
  });
});
