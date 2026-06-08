import { execSync } from "node:child_process";

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
