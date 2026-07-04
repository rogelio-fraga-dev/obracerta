import { expect, test } from "@playwright/test";
import { genWhatsapp, readOtp } from "./helpers";

/**
 * Fluxo crítico ponta a ponta pela UI: um profissional novo se cadastra (OTP →
 * dados → atuação → plano grátis) e cai na área logada. Lê o OTP do Redis (dev).
 */
test("onboarding do profissional até a área logada", async ({ page }) => {
  const whatsapp = genWhatsapp();
  await page.goto("/cadastro");

  // O cadastro abre na aba e-mail — o assistente por OTP vive na aba WhatsApp.
  await page.getByRole("tab", { name: "WhatsApp" }).click();

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

  // Passo 4: atuação — o catálogo virou chips (ProfessionPicker)
  await page.getByRole("button", { name: "Pedreiro" }).click();
  await page.getByLabel("Bairro de atuação").fill("Centro");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Passo 5: plano grátis → área logada (âncora evita casar o card "Pro" que cita "Iniciante")
  await page.getByRole("button", { name: /^Iniciante/ }).click();
  await page.getByRole("button", { name: "Começar grátis" }).click();

  await expect(page).toHaveURL(/\/inicio$/);
  // Âncora independente de viewport (a sidebar é desktop-only): o hero do painel.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
