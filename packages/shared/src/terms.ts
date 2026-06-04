import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";
import { userTypeSchema } from "./enums.js";

/**
 * Termos de ciência bilaterais (roadmap §7.4/§9). O aceite é APPEND-ONLY: cada
 * registro é imutável e serve de prova jurídica (vinculado ao `audit_log`).
 */

/** Registro de aceite de termo (imutável). */
export const termsAcceptanceSchema = z.object({
  id: uuidSchema,
  bookingId: uuidSchema,
  userId: uuidSchema,
  papel: userTypeSchema,
  termoVersao: z.string().trim().min(1).max(20),
  aceitoEm: isoTimestampSchema,
});
export type TermsAcceptance = z.infer<typeof termsAcceptanceSchema>;

/** Entrada de aceite (o usuário autenticado aceita o termo de um pedido). */
export const acceptTermsSchema = z.object({
  bookingId: uuidSchema,
  termoVersao: z.string().trim().min(1).max(20),
});
export type AcceptTermsInput = z.infer<typeof acceptTermsSchema>;
