/**
 * Porta de saída dos badges. Um badge fica ATIVO enquanto `revogado_em` é nulo;
 * o índice único parcial do banco garante no máximo um ativo por código por usuário.
 */
export interface BadgeRepository {
  /** Códigos de badges atualmente ativos do usuário. */
  listActiveCodes(userId: string): Promise<string[]>;
  /** Concede um badge (nova linha ativa). Só chamar para códigos ainda não ativos. */
  grant(userId: string, codigo: string): Promise<void>;
  /** Revoga o badge ativo do código (carimba `revogado_em`). */
  revoke(userId: string, codigo: string): Promise<void>;
}

export const BADGE_REPOSITORY = Symbol("BADGE_REPOSITORY");
