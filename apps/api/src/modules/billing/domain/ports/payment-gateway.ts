/** Parâmetros para criar uma assinatura recorrente no gateway. */
export interface CreateSubscriptionParams {
  userId: string;
  plano: string;
  valorCentavos: number;
  proximaCobranca: string; // ISO
  /** Token do cartão no gateway (trial do Iniciante exige cartão; nunca o número em claro). */
  cartaoToken?: string;
}

/** Parâmetros para criar uma cobrança avulsa no gateway. */
export interface CreateChargeParams {
  userId: string;
  valorCentavos: number;
  vencimento: string; // ISO
  descricao: string;
}

/** Parâmetros para estornar (total ou parcial) uma cobrança no gateway. */
export interface RefundChargeParams {
  chargeId: string;
  valorCentavos: number;
}

/** Referência a um recurso criado no gateway (id do provedor). */
export interface GatewayRef {
  gatewayId: string;
}

/** Parâmetros para obter o Pix (QR/copia-e-cola) de uma cobrança existente. */
export interface PixCodeParams {
  chargeId: string;
  valorCentavos: number;
  descricao: string;
}

/** BR Code Pix de uma cobrança (payload do QR = copia-e-cola). */
export interface PixCode {
  payload: string;
  txid: string;
}

/**
 * Porta de saída de pagamentos (roadmap §7.1). O provedor (Asaas, Pagar.me) fica
 * atrás desta interface; em dev usamos um adapter fake. A confirmação de pagamento
 * chega de forma assíncrona por webhook (não é retorno destes métodos).
 */
export interface PaymentGateway {
  /** Nome do provedor (gravado em `gateway` das tabelas; casa com os webhooks). */
  readonly name: string;
  /**
   * Gateway sandbox/fake? Habilita a **simulação de confirmação** de pagamento
   * (botão "Simular" no app). O adapter real de produção retorna `false` — a
   * simulação fica estruturalmente impossível fora do sandbox.
   */
  readonly sandbox: boolean;
  createSubscription(params: CreateSubscriptionParams): Promise<GatewayRef>;
  createCharge(params: CreateChargeParams): Promise<GatewayRef>;
  refund(params: RefundChargeParams): Promise<GatewayRef>;
  /** Pix da cobrança (no fake, EMV gerado localmente; no Asaas, vem do provedor). */
  getPixCode(params: PixCodeParams): Promise<PixCode>;
}

export const PAYMENT_GATEWAY = Symbol("PAYMENT_GATEWAY");
