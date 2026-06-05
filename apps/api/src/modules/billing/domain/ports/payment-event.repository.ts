/** Dados de um evento de webhook recebido do gateway. */
export interface PaymentEventData {
  gateway: string;
  eventId: string;
  tipo: string;
  payload: unknown;
}

/**
 * Porta de saída dos eventos de pagamento (idempotência de webhook). `record`
 * registra o evento UMA vez: devolve `true` se é novo, `false` se já existia
 * (UNIQUE gateway+eventId) — base do processamento idempotente.
 */
export interface PaymentEventRepository {
  record(data: PaymentEventData): Promise<boolean>;
}

export const PAYMENT_EVENT_REPOSITORY = Symbol("PAYMENT_EVENT_REPOSITORY");
