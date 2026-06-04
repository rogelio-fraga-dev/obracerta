import { randomInt } from "node:crypto";

/**
 * Lógica pura de OTP (sem I/O — testável isoladamente).
 * Código de 6 dígitos gerado com CSPRNG (`crypto.randomInt`), não `Math.random`.
 */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Chaves de Redis (namespaced) usadas no fluxo de OTP. */
export const otpKeys = {
  code: (whatsapp: string) => `otp:code:${whatsapp}`,
  attempts: (whatsapp: string) => `otp:attempts:${whatsapp}`,
  verified: (whatsapp: string) => `otp:verified:${whatsapp}`,
} as const;
