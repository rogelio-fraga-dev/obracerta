import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";

/**
 * Cupons/promoções e programa de indicação. Um cupom desconta a assinatura
 * (percentual, valor fixo em centavos ou dias grátis). Indicação gera cupons
 * automaticamente para indicador e indicado.
 */
export const CouponType = {
  PERCENTUAL: "PERCENTUAL",
  FIXO: "FIXO",
  DIAS_GRATIS: "DIAS_GRATIS",
} as const;
export const couponTypeSchema = z.nativeEnum(CouponType);
export type CouponType = z.infer<typeof couponTypeSchema>;

/** Código de cupom digitado (normalizado em maiúsculas no backend). */
export const couponCodeSchema = z.string().trim().min(3).max(24);

/** Cupom (catálogo — admin cria; indicação gera automaticamente). */
export const couponSchema = z.object({
  id: uuidSchema,
  codigo: z.string(),
  descricao: z.string().nullable(),
  tipo: couponTypeSchema,
  valor: z.number().int().positive(),
  validoAte: isoTimestampSchema.nullable(),
  usosMax: z.number().int().positive().nullable(),
  usosCount: z.number().int().min(0),
  ativo: z.boolean(),
  criadoEm: isoTimestampSchema,
});
export type Coupon = z.infer<typeof couponSchema>;

/** Criação de cupom pelo admin. */
export const createCouponSchema = z.object({
  codigo: couponCodeSchema,
  descricao: z.string().trim().max(160).optional(),
  tipo: couponTypeSchema,
  valor: z.number().int().positive(),
  validoAte: isoTimestampSchema.optional(),
  usosMax: z.number().int().positive().optional(),
});
export type CreateCouponInput = z.infer<typeof createCouponSchema>;

/** Prévia de um cupom aplicado (o que o usuário vê antes de assinar). */
export const couponPreviewSchema = z.object({
  codigo: z.string(),
  tipo: couponTypeSchema,
  valor: z.number().int().positive(),
  descricao: z.string().nullable(),
  /** Texto amigável do desconto (ex.: "20% de desconto", "7 dias grátis"). */
  resumo: z.string(),
});
export type CouponPreview = z.infer<typeof couponPreviewSchema>;

/** Entrada para validar/aplicar um cupom. */
export const applyCouponSchema = z.object({ codigo: couponCodeSchema });
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

/** Painel de indicação do usuário (código próprio + quem já indicou). */
export const referralSummarySchema = z.object({
  codigo: z.string(),
  /** Quantas pessoas se cadastraram com o meu código. */
  totalIndicados: z.number().int().min(0),
  /** Cupons de recompensa que ganhei por indicar (ainda não usados). */
  cuponsDisponiveis: z.array(couponPreviewSchema),
});
export type ReferralSummary = z.infer<typeof referralSummarySchema>;
