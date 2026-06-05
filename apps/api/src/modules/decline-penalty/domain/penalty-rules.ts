import { DeclineReason } from "@obracerta/shared";

/**
 * Domínio puro das penalidades (roadmap §8). Classifica motivos de recusa
 * (válidos não penalizam), define a escala por reincidência e calcula a taxa de
 * aceitação. Sem framework/ORM — testável isoladamente.
 */

/** Códigos de penalidade gravados em `penalties.motivo`. */
export const PenaltyReason = {
  RECUSA_INJUSTIFICADA: "RECUSA_INJUSTIFICADA",
  NAO_RESPONDEU: "NAO_RESPONDEU",
} as const;
export type PenaltyReason = (typeof PenaltyReason)[keyof typeof PenaltyReason];

/** Pontos-base de cada penalidade (antes da escala por reincidência). */
const BASE_POINTS: Record<PenaltyReason, number> = {
  RECUSA_INJUSTIFICADA: 1,
  NAO_RESPONDEU: 2,
};

/** Fator máximo da escala (1ª = base, 2ª = 2x, 3ª+ = 3x). */
const MAX_ESCALA_FACTOR = 3;

/** Motivos de recusa que NÃO penalizam (justificativas legítimas). */
const VALID_DECLINE_REASONS: ReadonlySet<DeclineReason> = new Set([
  DeclineReason.AGENDA_INDISPONIVEL,
  DeclineReason.FORA_DA_AREA,
  DeclineReason.ESCOPO_INCOMPATIVEL,
  DeclineReason.VALOR_INCOMPATIVEL,
  DeclineReason.OUTRO,
]);

/** True se o motivo de recusa gera penalidade. */
export function isDeclinePenalizable(reason: DeclineReason): boolean {
  return !VALID_DECLINE_REASONS.has(reason);
}

/** Converte um motivo de recusa no código de penalidade, ou null se válido. */
export function declineToPenaltyReason(reason: DeclineReason): PenaltyReason | null {
  return isDeclinePenalizable(reason) ? PenaltyReason.RECUSA_INJUSTIFICADA : null;
}

/**
 * Escala: pontos = base × fator, onde o fator cresce com penalidades anteriores
 * (1ª ofensa = 1x, 2ª = 2x, 3ª+ = 3x). `priorCount` = penalidades já existentes.
 */
export function escalatePoints(reason: PenaltyReason, priorCount: number): number {
  const factor = Math.min(priorCount + 1, MAX_ESCALA_FACTOR);
  return BASE_POINTS[reason] * factor;
}

/**
 * Taxa de aceitação = aprovados / (aprovados + recusados + expirados). Pedidos
 * pendentes e cancelados pelo contratante não contam. Sem histórico → 1 (100%).
 */
export function computeAcceptanceRate(
  aprovados: number,
  recusados: number,
  expirados: number,
): number {
  const considerados = aprovados + recusados + expirados;
  if (considerados === 0) return 1;
  return aprovados / considerados;
}
