import type { Subscription } from "@obracerta/shared";

/** Dados para registrar uma assinatura (status inicial EM_GRACA). */
export interface CreateSubscriptionData {
  userId: string;
  plano: string;
  gateway: string;
  gatewayId: string;
  valorCentavos: number;
  graceUntil: string; // ISO
  proximaCobranca: string; // ISO
}

/** Porta de saída das assinaturas. */
export interface SubscriptionRepository {
  create(data: CreateSubscriptionData): Promise<Subscription>;
  findById(id: string): Promise<Subscription | null>;
  /** Assinatura vigente (não-cancelada) do usuário, se houver. */
  findActiveByUser(userId: string): Promise<Subscription | null>;
  /** Marca como ATIVA (após confirmação do 1º pagamento). */
  activate(id: string): Promise<Subscription | null>;
  /** Cancela a assinatura (estorno / pedido do usuário): status CANCELADA + data. */
  cancel(id: string): Promise<Subscription | null>;
  /** Troca o plano (upgrade) de uma assinatura vigente: novo plano + valor. */
  changePlan(id: string, plano: string, valorCentavos: number): Promise<Subscription | null>;
  /** Avança a data da próxima cobrança (renovação recorrente). */
  setProximaCobranca(id: string, proximaCobranca: string): Promise<void>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol("SUBSCRIPTION_REPOSITORY");
