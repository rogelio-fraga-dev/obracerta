import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { DrizzleAdminMetricsRepository } from "./drizzle-admin-metrics.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 6.2): o snapshot de métricas roda contra o Postgres e
 * devolve contagens consistentes. Asserta a forma e invariantes (não números
 * exatos, que dependem do estado do banco). Requer docker:up. Fora do CI.
 */
describe("DrizzleAdminMetricsRepository (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const repo = new DrizzleAdminMetricsRepository(db);

  afterAll(async () => {
    await pool.end();
  });

  it("agrega contagens consistentes (todas >= 0 e invariantes)", async () => {
    const c = await repo.counts();

    // tudo é número não-negativo
    for (const valor of Object.values(c)) {
      expect(typeof valor).toBe("number");
      expect(valor).toBeGreaterThanOrEqual(0);
    }

    // invariantes do domínio
    expect(c.usuariosProfissionais + c.usuariosContratantes).toBe(c.usuariosTotal);
    expect(c.usuariosAtivos).toBeLessThanOrEqual(c.usuariosTotal);
    expect(c.usuariosSuspensos).toBeLessThanOrEqual(c.usuariosTotal);
    expect(c.agendamentosConcluidos).toBeLessThanOrEqual(c.agendamentosTotal);
    expect(c.profissionaisAtivados).toBeLessThanOrEqual(c.profissionaisComPerfil);
    expect(c.obrasAvaliadasBilateralmente * 2).toBeLessThanOrEqual(c.avaliacoesReveladas);
  });

  it("agrega o analytics com invariantes de funil/liquidez consistentes", async () => {
    const a = await repo.analytics();

    const escalares = { ...a, coorte: undefined };
    for (const valor of Object.values(escalares)) {
      if (valor === undefined) continue;
      expect(typeof valor).toBe("number");
      expect(valor).toBeGreaterThanOrEqual(0);
    }

    // funil: cada etapa é subconjunto da anterior
    expect(a.profissionaisComPerfil).toBeLessThanOrEqual(a.usuariosProfissionais);
    expect(a.profissionaisAtivados).toBeLessThanOrEqual(a.profissionaisComPerfil);
    // liquidez: obras com lance e adjudicadas não passam do total
    expect(a.obrasComLance).toBeLessThanOrEqual(a.obrasTotal);
    expect(a.obrasAdjudicadas).toBeLessThanOrEqual(a.obrasTotal);
    expect(a.obrasComLance).toBeLessThanOrEqual(a.lancesTotal); // ≥1 lance por obra com lance

    // coorte: forma do ponto
    expect(Array.isArray(a.coorte)).toBe(true);
    for (const ponto of a.coorte) {
      expect(typeof ponto.mes).toBe("string");
      expect(ponto.cadastros).toBeGreaterThanOrEqual(0);
    }
  });
});
