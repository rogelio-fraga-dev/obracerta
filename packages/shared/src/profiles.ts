import { z } from "zod";
import { uuidSchema, slugSchema } from "./primitives.js";
import { createUserSchema, userSchema } from "./user.js";
import { authTokensSchema } from "./auth.js";
import { professionalPlanSchema, contractorPlanSchema } from "./enums.js";

/**
 * Contratos de perfis e cadastro (roadmap §4.1/§4, §14). O cadastro em 4 passos
 * do front consome estes schemas; o back valida com os mesmos.
 */

/** Cadastro (passo 1–2): identidade base + cidade. WhatsApp já verificado por OTP. */
export const cadastroSchema = createUserSchema.extend({
  cidadeId: uuidSchema.optional(),
});
export type CadastroInput = z.infer<typeof cadastroSchema>;

/** Resultado do cadastro: usuário criado + tokens (auto-login). */
export const cadastroResultSchema = z.object({
  user: userSchema,
  tokens: authTokensSchema,
});
export type CadastroResult = z.infer<typeof cadastroResultSchema>;

/** Perfil público do profissional (sem dados sensíveis). */
export const professionalProfileSchema = z.object({
  userId: uuidSchema,
  especialidades: z.array(z.string().trim().min(2).max(60)).max(10),
  anosExperiencia: z.number().int().min(0).max(80).nullable(),
  bairro: z.string().trim().max(120).nullable(),
  fotoUrl: z.string().url().nullable(),
  valores: z.string().trim().max(500).nullable(),
  formacaoDeclarada: z.string().trim().max(200).nullable(),
  completudePct: z.number().int().min(0).max(100),
  plano: professionalPlanSchema,
  slugPublico: slugSchema,
  /** Identidade verificada por foto (selfie aprovada). */
  verificado: z.boolean().default(false),
});
export type ProfessionalProfile = z.infer<typeof professionalProfileSchema>;

/** Campos do perfil profissional editáveis pelo usuário (passos 3–4 do cadastro). */
export const updateProfessionalProfileSchema = z.object({
  especialidades: z.array(z.string().trim().min(2).max(60)).max(10).optional(),
  anosExperiencia: z.number().int().min(0).max(80).optional(),
  bairro: z.string().trim().max(120).optional(),
  valores: z.string().trim().max(500).optional(),
  formacaoDeclarada: z.string().trim().max(200).optional(),
});
export type UpdateProfessionalProfileInput = z.infer<typeof updateProfessionalProfileSchema>;

/** Perfil do contratante. */
export const contractorProfileSchema = z.object({
  userId: uuidSchema,
  plano: contractorPlanSchema,
  planoExpiraEm: z.string().datetime().nullable(),
});
export type ContractorProfile = z.infer<typeof contractorProfileSchema>;
