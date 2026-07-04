import { defineConfig, devices } from "@playwright/test";

/**
 * E2E da Fase 7 (qualidade). Assume web em :3000 e API em :3333 já rodando
 * (validação local). `reuseExistingServer` evita subir um segundo dev.
 */
export default defineConfig({
  testDir: "./e2e",
  // Sequencial: o /auth/login tem rate-limit (5/min por IP) e os fluxos usam
  // as mesmas contas de demo — paralelismo gera 429 e corrida de dados.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Fluxos multi-login em dev (Next compila cada rota na 1ª visita) estouram
  // os 30s default com folga — o budget maior evita falso negativo.
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
