import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cities } from "./schema/cities.js";
import * as schema from "./schema/index.js";

config({ path: "../../.env" });

/**
 * Seed de desenvolvimento. Idempotente: usa `onConflictDoNothing` na unique
 * (nome, uf), então pode rodar quantas vezes quiser. Expansão cidade-a-cidade
 * começa com poucas cidades ativas (roadmap §4.1).
 */
const SEED_CITIES = [
  { nome: "São Paulo", uf: "SP", ativa: true },
  { nome: "Campinas", uf: "SP", ativa: false },
];

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente.");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  await db.insert(cities).values(SEED_CITIES).onConflictDoNothing();
  const rows = await db.select().from(cities);

  // eslint-disable-next-line no-console
  console.log(`Seed concluído. ${rows.length} cidade(s) no banco.`);
  await pool.end();
}

main().catch((error: unknown) => {
  console.error("Seed falhou:", error);
  process.exit(1);
});
