import { expect, test } from "@playwright/test";
import { DEMO_USERS, login } from "./helpers";

/**
 * Fluxo crítico 2 (roadmap §13.5): contratante publica uma obra (UF→cidade),
 * o profissional Especialista dá um lance sigiloso e o contratante adjudica —
 * o chat da obra abre para os dois.
 *
 * Um contexto por usuário (login único cada) — ver nota de rate-limit no
 * pedido-flow.
 */
test.describe("fluxo obra → lance → adjudicação → chat", () => {
  test.skip(({ isMobile }) => Boolean(isMobile), "fluxo único — só no projeto desktop");

  test("ponta a ponta", async ({ browser }) => {
    const titulo = `Obra E2E ${Date.now()}`;
    const carlosCtx = await browser.newContext();
    const marcosCtx = await browser.newContext();
    const carlos = await carlosCtx.newPage();
    const marcos = await marcosCtx.newPage();
    await login(carlos, DEMO_USERS.contratante);
    await login(marcos, DEMO_USERS.profissionalEspecialista);

    try {
      // ── Contratante publica a obra ──
      await carlos.goto("/obras/nova");
      await expect(carlos.getByRole("heading", { name: "Nova obra" })).toBeVisible();
      await carlos.getByLabel("Estado").selectOption("SP");
      await carlos.getByLabel("Título").fill(titulo);
      await carlos.getByLabel("Especialidade").selectOption("Pedreiro");
      await carlos.getByRole("button", { name: "Publicar obra" }).click();
      await carlos.waitForURL(/\/obras\/[0-9a-f-]{36}$/, { timeout: 30_000 });
      const obraUrl = carlos.url();
      await expect(carlos.getByRole("heading", { name: titulo })).toBeVisible();

      // ── Profissional Especialista dá o lance (sigiloso) ──
      await marcos.goto(obraUrl);
      await expect(marcos.getByRole("heading", { name: "Enviar lance" })).toBeVisible();
      await marcos.getByLabel("Seu valor (R$)").fill("3500");
      await marcos.getByRole("button", { name: "Enviar lance" }).click();
      await expect(marcos.getByRole("heading", { name: "Seu lance" })).toBeVisible({
        timeout: 30_000,
      });

      // ── Contratante adjudica → chat da obra abre ──
      await carlos.goto(obraUrl);
      await carlos.getByRole("button", { name: "Aceitar esta proposta" }).first().click();
      await expect(carlos.getByRole("heading", { name: "Conversa" })).toBeVisible({
        timeout: 30_000,
      });
      await carlos.getByPlaceholder("Escreva sua mensagem…").fill("Parabéns pelo lance! [e2e]");
      await carlos.getByRole("button", { name: "Enviar", exact: true }).click();
      await expect(carlos.getByText("Parabéns pelo lance! [e2e]")).toBeVisible();

      // ── Profissional vê a mensagem no chat da obra ──
      await marcos.goto(obraUrl);
      await expect(marcos.getByText("Parabéns pelo lance! [e2e]")).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      await carlosCtx.close();
      await marcosCtx.close();
    }
  });
});
