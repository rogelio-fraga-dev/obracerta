import { expect, test } from "@playwright/test";
import { genWhatsapp, readOtp } from "./helpers";

/**
 * Fluxo crítico ponta a ponta pela UI: um profissional novo se cadastra (OTP →
 * dados → atuação → plano grátis) e cai na área logada. Lê o OTP do Redis (dev).
 */
test("onboarding do profissional até a área logada", async ({ page }) => {
  const whatsapp = genWhatsapp();
  await page.goto("/cadastro");

  // Passo 1: WhatsApp
  await page.getByPlaceholder("+5511999999999").fill(whatsapp);
  await page.getByRole("button", { name: "Enviar código" }).click();

  // Passo 2: código (lido do Redis)
  const codeInput = page.getByPlaceholder("000000");
  await expect(codeInput).toBeVisible();
  await expect.poll(() => readOtp(whatsapp), { timeout: 5000 }).not.toEqual("");
  await codeInput.fill(readOtp(whatsapp));
  await page.getByRole("button", { name: "Verificar" }).click();

  // Passo 3: perfil (Profissional + nome)
  await page.getByRole("button", { name: "Profissional" }).click();
  await page.getByLabel("Nome completo").fill("Profissional E2E");
  await page.getByRole("button", { name: "Criar conta" }).click();

  // Passo 4: atuação
  await page.getByLabel("Especialidades").fill("Pintura");
  await page.getByLabel("Bairro de atuação").fill("Centro");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Passo 5: plano grátis → área logada (âncora evita casar o card "Pro" que cita "Iniciante")
  await page.getByRole("button", { name: /^Iniciante/ }).click();
  await page.getByRole("button", { name: "Começar grátis" }).click();

  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
});
