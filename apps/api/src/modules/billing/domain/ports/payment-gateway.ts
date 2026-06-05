/** Parâmetros para criar uma assinatura recorrente no gateway. */
export interface CreateSubscriptionParams {
  userId: string;
  plano: string;
  valorCentavos: number;
  proximaCobranca: string; // ISO
}

/** Parâmetros para criar uma cobrança avulsa no gateway. */
export interface CreateChargeParams {
  userId: string;
  valorCentavos: number;
  vencimento: string; // ISO
  descricao: string;
}

/** Referência a um recurso criado no gateway (id do provedor). */
export interface GatewayRef {
  gatewayId: string;
}

/**
 * Porta de saída de pagamentos (roadmap §7.1). O provedor (Asaas, Pagar.me) fica
 * atrás desta interface; em dev usamos um adapter fake. A confirmação de pagamento
 * chega de forma assíncrona por webhook (não é retorno destes métodos).
 */
export interface PaymentGateway {
  /** Nome do provedor (gravado em `gateway` das tabelas; casa com os webhooks). */
  readonly name: string;
  createSubscription(params: CreateSubscriptionParams): Promise<GatewayRef>;
  createCharge(params: CreateChargeParams): Promise<GatewayRef>;
}

export const PAYMENT_GATEWAY = Symbol("PAYMENT_GATEWAY");
