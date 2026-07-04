import type { RankingEntry } from "@obracerta/shared";

/**
 * Linha crua de avaliação vinda do banco: o `autorNome` é o **nome completo** —
 * a camada de aplicação aplica `nomeParcial` (LGPD) antes de expor.
 */
export interface ReviewRow {
  nota: number;
  comentario: string | null;
  criadoEm: string;
  autorNome: string;
  resposta: string | null;
}

/**
 * Consultas de leitura do perfil público que não pertencem a nenhum outro
 * repositório de domínio (ranking, contagem de obras, avaliações paginadas).
 * Mantém o SQL na infraestrutura, fora da camada de aplicação (hexagonal).
 */
export interface PublicQueryRepository {
  /** Nº de obras concluídas do profissional (sinal de confiança). */
  countCompletedWorks(userId: string): Promise<number>;
  /** Top profissionais por obras concluídas + reputação. */
  listRanking(limit: number): Promise<RankingEntry[]>;
  /** Avaliações reveladas do profissional, paginadas e filtráveis por nota. */
  listReviewsPaged(
    userId: string,
    page: number,
    limit: number,
    nota?: number,
  ): Promise<{ items: ReviewRow[]; total: number }>;
}

export const PUBLIC_QUERY_REPOSITORY = Symbol("PUBLIC_QUERY_REPOSITORY");
