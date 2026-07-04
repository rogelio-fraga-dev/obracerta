import { execSync } from "node:child_process";
import type { Page } from "@playwright/test";

/** Credenciais de demo do seed local (docs/desenvolvimento-local.md). */
export const DEMO_USERS = {
  contratante: { email: "carlos@example.com", senha: "senha@123" },
  profissionalPro: { email: "joana@example.com", senha: "senha@123" },
  profissionalEspecialista: { email: "marcos@example.com", senha: "senha@123" },
};

/**
 * Login por e-mail e senha; espera cair no /inicio. O /auth/login tem
 * rate-limit (5/min por IP) — num 429 transitório, espera a janela virar e
 * tenta mais uma vez em vez de derrubar a suíte.
 */
export async function login(page: Page, user: { email: string; senha: string }): Promise<void> {
  for (let tentativa = 1; ; tentativa++) {
    await page.goto("/entrar");
    await page.getByPlaceholder("voce@email.com").fill(user.email);
    await page.getByPlaceholder("••••••••").fill(user.senha);
    await page.getByRole("button", { name: "Entrar na minha conta" }).click();
    try {
      await page.waitForURL("**/inicio", { timeout: 20_000 });
      return;
    } catch (e) {
      if (tentativa >= 2) throw e;
      await page.waitForTimeout(45_000); // janela do throttler (60s) girar
    }
  }
}

/** Troca de usuário: limpa a sessão (cookies) e loga o próximo. */
export async function switchUser(
  page: Page,
  user: { email: string; senha: string },
): Promise<void> {
  await page.context().clearCookies();
  await login(page, user);
}

/**
 * Data/hora futura ÚNICA por execução (dia 2–60, hora 8–16) no formato do input
 * datetime-local. Evita conflito de agenda com pedidos aprovados em rodadas
 * anteriores (o aceite bloqueia a janela do serviço).
 */
export function dataServicoUnica(): string {
  const dias = 2 + Math.floor(Math.random() * 58);
  const hora = 8 + Math.floor(Math.random() * 9);
  const d = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hora)}:00`;
}

/** WhatsApp único e válido (`+55DDD9XXXXXXXX`) para cada teste. */
export function genWhatsapp(): string {
  const n = Math.floor(10000000 + Math.random() * 89999999);
  return `+55349${n}`;
}

/**
 * Lê o OTP do Redis (dev). Acopla ao docker local de propósito — a Fase 7 valida
 * em localhost. Em CI com outro setup, trocar por um endpoint de teste.
 */
export function readOtp(whatsapp: string): string {
  const out = execSync(`docker exec obracerta-redis redis-cli GET "otp:code:${whatsapp}"`, {
    encoding: "utf8",
  });
  return out.trim();
}
