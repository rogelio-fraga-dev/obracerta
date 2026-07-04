import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Páginas públicas: carregam, têm hierarquia e passam na auditoria de acessibilidade. */
test.describe("Páginas públicas", () => {
  test("landing carrega com um h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("/entrar mostra o formulário de login", async ({ page }) => {
    await page.goto("/entrar");
    // Aba padrão: e-mail e senha (o login ganhou abas + Google no pacote visual).
    await expect(page.getByPlaceholder("voce@email.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar na minha conta" })).toBeVisible();
    // Aba WhatsApp continua acessível.
    await page.getByRole("tab", { name: "WhatsApp" }).click();
    await expect(page.getByPlaceholder("11 99999 9999")).toBeVisible();
    await expect(page.getByRole("button", { name: "Receber código" })).toBeVisible();
  });

  test("landing sem violações sérias de acessibilidade (WCAG AA)", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const graves = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(graves, JSON.stringify(graves.map((v) => v.id))).toEqual([]);
  });

  test("/entrar sem violações sérias de acessibilidade", async ({ page }) => {
    await page.goto("/entrar");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const graves = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(graves, JSON.stringify(graves.map((v) => v.id))).toEqual([]);
  });
});
