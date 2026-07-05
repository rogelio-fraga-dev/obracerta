import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";

/**
 * Notificações in-app (avisos e lembretes): sino no shell + página /notificacoes.
 * Engajam profissionais e contratantes com o que aconteceu na conta.
 */

/** Categorias — orientam ícone e agrupamento na UI. */
export const notificationTypeSchema = z.enum([
  "PEDIDO",
  "OBRA",
  "AVALIACAO",
  "COBRANCA",
  "SISTEMA",
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

/** Uma notificação do usuário. */
export const notificationSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  tipo: notificationTypeSchema,
  titulo: z.string().min(1).max(140),
  corpo: z.string().max(500).nullable(),
  /** Rota interna para onde a notificação leva (ex.: /pedidos/<id>). */
  link: z.string().max(300).nullable(),
  lida: z.boolean(),
  criadoEm: isoTimestampSchema,
});
export type Notification = z.infer<typeof notificationSchema>;

/** Resumo para o sino do shell. */
export const notificationSummarySchema = z.object({
  naoLidas: z.number().int().min(0),
});
export type NotificationSummary = z.infer<typeof notificationSummarySchema>;

/** Inscrição de Web Push enviada pelo browser (shape do PushSubscription.toJSON). */
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
});
export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;

/** Chave pública VAPID (null = push desabilitado no servidor). */
export const pushPublicKeySchema = z.object({ key: z.string().nullable() });
export type PushPublicKey = z.infer<typeof pushPublicKeySchema>;

/**
 * Preferência de notificação por categoria. O aviso **in-app** (sino) é sempre
 * registrado; `pushEnabled` controla apenas o **Web Push** daquela categoria.
 */
export const notificationPreferenceSchema = z.object({
  tipo: notificationTypeSchema,
  pushEnabled: z.boolean(),
});
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;

/** Atualização de uma preferência (mesma forma). */
export const updateNotificationPreferenceSchema = notificationPreferenceSchema;
export type UpdateNotificationPreferenceInput = z.infer<
  typeof updateNotificationPreferenceSchema
>;
