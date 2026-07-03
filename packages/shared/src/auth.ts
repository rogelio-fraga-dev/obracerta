import { z } from "zod";
import { emailSchema, whatsappSchema } from "./primitives.js";
import { userTypeSchema } from "./enums.js";
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
  code: z.string().length(6, "O código deve ter 6 dígitos."),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, "A senha antiga é obrigatória"),
  newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
});
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

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

/**
 * Senha do cadastro por e-mail (login "conta normal"). Mínimo de 8 caracteres —
 * regra de formato; o hash (scrypt) vive no backend, nunca trafega o texto puro
 * além do POST de cadastro/login sobre HTTPS.
 */
export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres")
  .max(128, "A senha é muito longa");

/**
 * Cadastro "conta normal" (e-mail + senha). Coletamos só o essencial; o resto
 * (especialidades, plano, cidade detalhada) é completado depois de entrar.
 */
export const registerSchema = z.object({
  nomeCompleto: z.string().trim().min(2, "Informe seu nome").max(120),
  email: emailSchema,
  password: passwordSchema,
  whatsapp: whatsappSchema,
  tipo: userTypeSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Login por e-mail + senha. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Login com Google (OAuth code flow): o BFF troca o `code` na API. */
export const googleLoginSchema = z.object({
  code: z.string().trim().min(1).max(2048),
  redirectUri: z.string().url(),
});
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

/**
 * Resultado do login com Google:
 * - e-mail já cadastrado → login completo (tokens + user);
 * - e-mail sem conta → `registered: false` com os dados do Google para
 *   pré-preencher o cadastro (a conta é criada pelo fluxo normal).
 */
export const googleAuthResultSchema = z.discriminatedUnion("registered", [
  z.object({ registered: z.literal(true), user: userSchema, tokens: authTokensSchema }),
  z.object({ registered: z.literal(false), email: emailSchema, nome: z.string() }),
]);
export type GoogleAuthResult = z.infer<typeof googleAuthResultSchema>;
