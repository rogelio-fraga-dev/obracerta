import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";
import {
  professionalPlanSchema,
  contractorPlanSchema,
  subscriptionStatusSchema,
  purchaseStatusSchema,
  invoiceStatusSchema,
  refundStatusSchema,
  paymentMethodSchema,
} from "./enums.js";

/**
 * Contratos de monetização (roadmap §4.5/§7.1/§19/§21). Dois modelos: assinatura
 * recorrente do profissional (`subscriptions`) e compra avulsa do contratante
 * (`purchases`), ambas geram faturas (`invoices`) e podem ser estornadas (`refunds`).
 *
 * VALORES SÃO INTEIROS EM CENTAVOS (`valorCentavos`) — nunca float (evita erro de
 * arredondamento em dinheiro). Ex.: R$ 49,00 = 4900.
 */

/** Valor monetário em centavos (inteiro positivo). */
export const centavosSchema = z.number().int().positive();
export type Centavos = z.infer<typeof centavosSchema>;

/** Assinatura recorrente do profissional (PRO/ESPECIALISTA). */
export const subscriptionSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  plano: professionalPlanSchema,
  status: subscriptionStatusSchema,
  gateway: z.string().trim().min(2).max(20),
  gatewayId: z.string().trim().max(64).nullable(),
  valorCentavos: centavosSchema,
  graceUntil: isoTimestampSchema.nullable(),
  proximaCobranca: isoTimestampSchema.nullable(),
  canceladoEm: isoTimestampSchema.nullable(),
  criadoEm: isoTimestampSchema,
  atualizadoEm: isoTimestampSchema,
});
export type Subscription = z.infer<typeof subscriptionSchema>;

/** Compra avulsa do contratante (BASICO/COMPLETO/LANCE) — sem recorrência. */
export const purchaseSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  plano: contractorPlanSchema,
  status: purchaseStatusSchema,
  gateway: z.string().trim().min(2).max(20),
  gatewayId: z.string().trim().max(64).nullable(),
  valorCentavos: centavosSchema,
  expiraEm: isoTimestampSchema.nullable(),
  criadoEm: isoTimestampSchema,
  atualizadoEm: isoTimestampSchema,
});
export type Purchase = z.infer<typeof purchaseSchema>;

/** Fatura/cobrança vinculada a uma assinatura OU a uma compra (exatamente uma). */
export const invoiceSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  subscriptionId: uuidSchema.nullable(),
  purchaseId: uuidSchema.nullable(),
  gateway: z.string().trim().min(2).max(20),
  gatewayId: z.string().trim().max(64).nullable(),
  valorCentavos: centavosSchema,
  status: invoiceStatusSchema,
  metodo: paymentMethodSchema.nullable(),
  vencimentoEm: isoTimestampSchema,
  pagoEm: isoTimestampSchema.nullable(),
  criadoEm: isoTimestampSchema,
  atualizadoEm: isoTimestampSchema,
});
export type Invoice = z.infer<typeof invoiceSchema>;

/** Reembolso de uma fatura paga (total ou parcial, 4 cenários CDC §21). */
export const refundSchema = z.object({
  id: uuidSchema,
  invoiceId: uuidSchema,
  userId: uuidSchema,
  valorCentavos: centavosSchema,
  motivo: z.string().trim().min(2).max(120),
  status: refundStatusSchema,
  solicitadoEm: isoTimestampSchema,
  processadoEm: isoTimestampSchema.nullable(),
});
export type Refund = z.infer<typeof refundSchema>;
