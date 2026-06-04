import { z } from "zod";

/**
 * Reusable Zod primitives shared between frontend and backend.
 *
 * These are *format-level* validators (system-boundary validation, plan §2.4).
 * Business rules (e.g. CPF check-digit verification, uniqueness) belong in the
 * domain layer and are intentionally NOT implemented here in Fase 0.
 */

/** UUID v4 identifier. */
export const uuidSchema = z.string().uuid();

/** E-mail (optional in most flows — login is OTP/WhatsApp-first). */
export const emailSchema = z.string().trim().toLowerCase().email();

/**
 * Brazilian mobile in E.164 format: +55 + DDD (2) + 9-digit number.
 * Example: +5534991234567
 */
export const whatsappSchema = z
  .string()
  .trim()
  .regex(/^\+55\d{2}9\d{8}$/, "WhatsApp deve estar no formato +55DDD9XXXXXXXX");

/**
 * CPF as 11 digits (format only — sem dígito verificador nesta camada).
 * CPF nunca é exposto publicamente (LGPD, plan §9).
 */
export const cpfSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, "CPF deve conter 11 dígitos");

/** Public profile slug: lowercase, alfanumérico e hífens. */
export const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido");

/** ISO-8601 timestamp string. */
export const isoTimestampSchema = z.string().datetime();

export type Uuid = z.infer<typeof uuidSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Whatsapp = z.infer<typeof whatsappSchema>;
export type Cpf = z.infer<typeof cpfSchema>;
export type Slug = z.infer<typeof slugSchema>;
