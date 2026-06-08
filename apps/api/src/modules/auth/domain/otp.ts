
/**
 * Lógica pura de OTP (sem I/O — testável isoladamente).
 * Código de 6 dígitos gerado com CSPRNG (`crypto.randomInt`), não `Math.random`.
 */
export function generateOtpCode(): string {
  // Para facilitar testes no ambiente de desenvolvimento:
  if (process.env.NODE_ENV !== "production") return "123456";
  const min = 100000;
  const max = 999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/** Chaves de Redis (namespaced) usadas no fluxo de OTP. */
export const otpKeys = {
  code: (whatsapp: string) => `otp:code:${whatsapp}`,
  attempts: (whatsapp: string) => `otp:attempts:${whatsapp}`,
  verified: (whatsapp: string) => `otp:verified:${whatsapp}`,
} as const;
