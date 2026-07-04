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

/** Entrada para o profissional assinar um plano recorrente (INICIANTE é grátis). */
export const createSubscriptionSchema = z.object({ plano: professionalPlanSchema });
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

/** Entrada para o contratante comprar um plano avulso. */
export const createPurchaseSchema = z.object({ plano: contractorPlanSchema });
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

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

/**
 * Reembolso enriquecido para a fila do financeiro (admin): dados do solicitante
 * e da fatura de origem, para decidir sem consultar outras telas.
 */
export const pendingRefundDetailSchema = refundSchema.extend({
  cliente: z.object({ nome: z.string(), email: z.string() }).nullable(),
  fatura: z
    .object({
      valorCentavos: centavosSchema,
      vencimentoEm: isoTimestampSchema,
      pagoEm: isoTimestampSchema.nullable(),
      metodo: z.string().nullable(),
      gatewayId: z.string().nullable(),
    })
    .nullable(),
});
export type PendingRefundDetail = z.infer<typeof pendingRefundDetailSchema>;

/**
 * Cobrança Pix de uma fatura (QR Code + copia-e-cola). Em sandbox o payload é
 * gerado localmente (EMV fictício) e `simulavel: true` habilita o botão de
 * confirmar o pagamento de mentira; com gateway real, vem do provedor.
 */
export const pixChargeSchema = z.object({
  invoiceId: uuidSchema,
  /** BR Code EMV (conteúdo do QR e do copia-e-cola). */
  payload: z.string().min(10),
  txid: z.string().min(1).max(64),
  valorCentavos: centavosSchema,
  vencimentoEm: isoTimestampSchema,
  /** true = gateway sandbox (permite simular a confirmação). */
  simulavel: z.boolean(),
});
export type PixCharge = z.infer<typeof pixChargeSchema>;
