import { z } from "zod";
import { uuidSchema, emailSchema, whatsappSchema, isoTimestampSchema } from "./primitives.js";
import { userTypeSchema, userStatusSchema } from "./enums.js";

/**
 * Sample User schema — the end-to-end type-safety POC for Fase 0 (plan §8).
 *
 * apps/api validates inbound payloads with `createUserSchema`; apps/web infers
 * its form/response types from the SAME schema. One source of truth, no drift.
 * Full domain modelling (profiles, cities, etc.) lands in Fase 1.
 */

/** Public-safe representation of a user (never includes CPF — LGPD, plan §9). */
export const userSchema = z.object({
  id: uuidSchema,
  nomeCompleto: z.string().trim().min(2).max(120),
  whatsapp: whatsappSchema,
  email: emailSchema.optional(),
  tipo: userTypeSchema,
  status: userStatusSchema,
  criadoEm: isoTimestampSchema,
});
export type User = z.infer<typeof userSchema>;

/** Payload to create a user (cadastro — passo 1). */
export const createUserSchema = z.object({
  nomeCompleto: z.string().trim().min(2).max(120),
  whatsapp: whatsappSchema,
  email: emailSchema.optional(),
  tipo: userTypeSchema,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;
