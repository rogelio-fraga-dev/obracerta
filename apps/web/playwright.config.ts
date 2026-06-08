import { defineConfig, devices } from "@playwright/test";

/**
 * E2E da Fase 7 (qualidade). Assume web em :3000 e API em :3333 já rodando
 * (validação local). `reuseExistingServer` evita subir um segundo dev.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
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
