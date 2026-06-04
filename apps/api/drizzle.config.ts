import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit roda fora do Nest, então carregamos o .env da raiz do monorepo
// (mesma fonte que a app valida no boot).
config({ path: "../../.env" });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL ausente — copie .env.example para .env na raiz.");
}

export default defineConfig({
  schema: "./src/infrastructure/database/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
