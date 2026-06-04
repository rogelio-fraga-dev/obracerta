import { z } from "zod";
import { whatsappSchema } from "./primitives.js";
import { userSchema } from "./user.js";

/**
 * Contratos de autenticação (login por OTP no WhatsApp — roadmap §6).
 * Compartilhados front↔back: o web usa os mesmos schemas nos formulários.
 */

/** Código OTP: 6 dígitos numéricos. */
export const otpCodeSchema = z.string().regex(/^\d{6}$/, "Código deve ter 6 dígitos");

/** Passo 1 — solicitar OTP para um WhatsApp. */
export const otpRequestSchema = z.object({
  whatsapp: whatsappSchema,
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

/** Resposta do passo 1 — quanto tempo o código vale. */
export const otpRequestResultSchema = z.object({
  expiresInSeconds: z.number().int().positive(),
});
export type OtpRequestResult = z.infer<typeof otpRequestResultSchema>;

/** Passo 2 — validar o código. */
export const otpVerifySchema = z.object({
  whatsapp: whatsappSchema,
  code: otpCodeSchema,
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

/** Par de tokens emitido no login. */
export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

/**
 * Resultado do verify (união discriminada por `registered`):
 * - usuário existe → login completo com tokens + user;
 * - não existe → o cadastro (fatia 1.2) segue com o WhatsApp já verificado.
 */
export const authResultSchema = z.discriminatedUnion("registered", [
  z.object({ registered: z.literal(true), user: userSchema, tokens: authTokensSchema }),
  z.object({ registered: z.literal(false) }),
]);
export type AuthResult = z.infer<typeof authResultSchema>;

/** Renovação de sessão. */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

/** Conteúdo do access token (claims). */
export const jwtClaimsSchema = z.object({
  sub: z.string().uuid(),
  whatsapp: whatsappSchema,
});
export type JwtClaims = z.infer<typeof jwtClaimsSchema>;
