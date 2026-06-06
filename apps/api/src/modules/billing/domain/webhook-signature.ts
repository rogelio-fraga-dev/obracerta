import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Assinatura HMAC dos webhooks de pagamento (roadmap §7.1, hardening Fase 6). O
 * provedor assina os campos significativos do evento com um segredo compartilhado;
 * o servidor recalcula e compara em tempo constante. Sem segredo válido, o webhook
 * é recusado — impede que qualquer um POSTe `/billing/webhook` forjando um pagamento.
 */

/** Campos canônicos assinados (ordem fixa). */
export interface SignedWebhookPayload {
  eventId: string;
  tipo: string;
  chargeId: string;
}

/** String canônica assinada — ordem e separador fixos para reprodutibilidade. */
function canonical(payload: SignedWebhookPayload): string {
  return `${payload.eventId}.${payload.tipo}.${payload.chargeId}`;
}

/** HMAC-SHA256 (hex) dos campos do evento com o segredo. */
export function webhookSignature(secret: string, payload: SignedWebhookPayload): string {
  return createHmac("sha256", secret).update(canonical(payload)).digest("hex");
}

/** Verifica a assinatura recebida em tempo constante (false se ausente/divergente). */
export function verifyWebhookSignature(
  secret: string,
  payload: SignedWebhookPayload,
  provided: string | undefined | null,
): boolean {
  if (!provided) return false;
  const expected = Buffer.from(webhookSignature(secret, payload), "utf8");
  const got = Buffer.from(provided, "utf8");
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}
