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
/** Capitais de todas as UFs (ativas) + interior piloto — obra pode nascer em qualquer estado. */
const SEED_CITIES = [
  { nome: "São Paulo", uf: "SP", ativa: true },
  { nome: "Campinas", uf: "SP", ativa: true },
  { nome: "Rio Branco", uf: "AC", ativa: true },
  { nome: "Maceió", uf: "AL", ativa: true },
  { nome: "Macapá", uf: "AP", ativa: true },
  { nome: "Manaus", uf: "AM", ativa: true },
  { nome: "Salvador", uf: "BA", ativa: true },
  { nome: "Fortaleza", uf: "CE", ativa: true },
  { nome: "Brasília", uf: "DF", ativa: true },
  { nome: "Vitória", uf: "ES", ativa: true },
  { nome: "Goiânia", uf: "GO", ativa: true },
  { nome: "São Luís", uf: "MA", ativa: true },
  { nome: "Cuiabá", uf: "MT", ativa: true },
  { nome: "Campo Grande", uf: "MS", ativa: true },
  { nome: "Belo Horizonte", uf: "MG", ativa: true },
  { nome: "Belém", uf: "PA", ativa: true },
  { nome: "João Pessoa", uf: "PB", ativa: true },
  { nome: "Curitiba", uf: "PR", ativa: true },
  { nome: "Recife", uf: "PE", ativa: true },
  { nome: "Teresina", uf: "PI", ativa: true },
  { nome: "Rio de Janeiro", uf: "RJ", ativa: true },
  { nome: "Natal", uf: "RN", ativa: true },
  { nome: "Porto Alegre", uf: "RS", ativa: true },
  { nome: "Porto Velho", uf: "RO", ativa: true },
  { nome: "Boa Vista", uf: "RR", ativa: true },
  { nome: "Florianópolis", uf: "SC", ativa: true },
  { nome: "Aracaju", uf: "SE", ativa: true },
  { nome: "Palmas", uf: "TO", ativa: true },
];

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente.");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  // Upsert com reativação: cidades já existentes voltam a `ativa: true` (o seed
  // é a fonte da lista de operação; desativação manual é exceção, não regra).
  await db
    .insert(cities)
    .values(SEED_CITIES)
    .onConflictDoUpdate({
      target: [cities.nome, cities.uf],
      set: { ativa: true },
    });
  const rows = await db.select().from(cities);

  // eslint-disable-next-line no-console
  console.log(`Seed concluído. ${rows.length} cidade(s) no banco.`);
  await pool.end();
}

main().catch((error: unknown) => {
  console.error("Seed falhou:", error);
  process.exit(1);
});
