import type { ReputationEvent } from "@obracerta/shared";

/** Dados de um evento da trilha de reputação (append-only). */
export interface CreateReputationEventData {
  userId: string;
  tipo: string;
  referenciaId: string | null;
  dados: unknown;
}

/**
 * Porta de saída da trilha de reputação por-usuário (`reputation_events`,
 * append-only). Diferente do `audit_log` (trilha global tamper-evident), esta é a
 * linha do tempo que alimenta a reputação de um usuário (avaliações reveladas, badges).
 */
export interface ReputationEventRepository {
  append(data: CreateReputationEventData): Promise<ReputationEvent>;
  listForUser(userId: string): Promise<ReputationEvent[]>;
}

export const REPUTATION_EVENT_REPOSITORY = Symbol("REPUTATION_EVENT_REPOSITORY");
