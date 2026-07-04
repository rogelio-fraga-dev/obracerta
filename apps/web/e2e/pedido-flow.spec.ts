import { expect, test } from "@playwright/test";
import { DEMO_USERS, login, dataServicoUnica } from "./helpers";

/**
 * Fluxo crítico 1 (roadmap §13.5): contratante busca a profissional, agenda,
 * a profissional aprova, os dois conversam no chat e o contratante cancela
 * (limpeza — o pedido de teste não fica pendurado na demo).
 *
 * Um contexto de browser por usuário (login único cada): o /auth/login tem
 * rate-limit de 5/min por IP — trocar de usuário relogando estoura o limite.
 */
test.describe("fluxo pedido → aceite → chat", () => {
  test.skip(({ isMobile }) => Boolean(isMobile), "fluxo único — só no projeto desktop");

  test("ponta a ponta", async ({ browser }) => {
    const carlosCtx = await browser.newContext();
    const joanaCtx = await browser.newContext();
    const carlos = await carlosCtx.newPage();
    const joana = await joanaCtx.newPage();
    await login(carlos, DEMO_USERS.contratante);
    await login(joana, DEMO_USERS.profissionalPro);

    try {
      // ── Contratante busca e agenda (data única evita conflito de agenda) ──
      await carlos.goto("/buscar?q=Joana");
      await expect(carlos.getByRole("heading", { name: "Encontrar profissional" })).toBeVisible();
      await carlos.getByRole("button", { name: "Agendar" }).first().click();
      await carlos.waitForURL("**/pedidos/novo**");

      await expect(carlos.getByText(/Joana/).first()).toBeVisible();
      await carlos.locator('input[type="datetime-local"]').fill(dataServicoUnica());
      await carlos.getByRole("button", { name: "Enviar pedido" }).click();
      await carlos.waitForURL(/\/pedidos\/[0-9a-f-]{36}$/, { timeout: 30_000 });
      const pedidoUrl = carlos.url();

      // ── Profissional aprova → o chat abrir é a prova real do aceite ──
      await joana.goto(pedidoUrl);
      await joana.getByRole("button", { name: "Aprovar" }).click();
      await expect(joana.getByRole("heading", { name: "Conversa" })).toBeVisible({
        timeout: 30_000,
      });
      await joana.getByPlaceholder("Escreva sua mensagem…").fill("Confirmo o horário! [e2e]");
      await joana.getByRole("button", { name: "Enviar", exact: true }).click();
      await expect(joana.getByText("Confirmo o horário! [e2e]")).toBeVisible();

      // ── Contratante vê a mensagem e o resumo; cancela para limpar a demo ──
      await carlos.goto(pedidoUrl);
      await expect(carlos.getByText("Confirmo o horário! [e2e]")).toBeVisible();
      await expect(carlos.getByRole("link", { name: /Exportar resumo/ })).toBeVisible();

      await carlos.getByRole("button", { name: "Cancelar pedido" }).click();
      await carlos.getByRole("button", { name: "Sim, cancelar" }).click();
      await expect(carlos.getByText("Este pedido foi cancelado.")).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      await carlosCtx.close();
      await joanaCtx.close();
    }
  });
});
