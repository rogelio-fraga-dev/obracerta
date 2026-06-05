import { BookingStatus, UserType } from "@obracerta/shared";

/**
 * Domínio puro da reputação (roadmap §4.3/§12). Regras da avaliação dupla-cega:
 * elegibilidade (só após CONCLUIDO), identificação do alvo/papel, janela de 7 dias,
 * condição de revelação simultânea e média de notas. Sem framework/ORM — testável
 * isoladamente.
 */

/** Janela (em dias) para avaliar após a conclusão da obra. */
export const REVIEW_WINDOW_DAYS = 7;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Alvo + papel do autor de uma avaliação. */
export interface ReviewParticipant {
  alvoId: string;
  papelAutor: UserType;
}

/** Prazo de revelação por janela: conclusão + 7 dias. */
export function reviewDeadline(completedAt: Date): Date {
  return new Date(completedAt.getTime() + REVIEW_WINDOW_DAYS * MS_POR_DIA);
}

/**
 * Quem o autor avalia e em que papel. Numa obra, cada lado avalia o outro:
 * contratante → profissional (papel CONTRATANTE) e vice-versa. `null` se o autor
 * não é participante do pedido.
 */
export function reviewParticipant(
  authorId: string,
  contractorId: string,
  professionalId: string,
): ReviewParticipant | null {
  if (authorId === contractorId) {
    return { alvoId: professionalId, papelAutor: UserType.CONTRATANTE };
  }
  if (authorId === professionalId) {
    return { alvoId: contractorId, papelAutor: UserType.PROFISSIONAL };
  }
  return null;
}

/** Só pedidos concluídos podem ser avaliados. */
export function canReviewStatus(status: BookingStatus): boolean {
  return status === BookingStatus.CONCLUIDO;
}

/**
 * Revelação simultânea: as notas só saem juntas quando ambos os lados avaliaram
 * (2 avaliações no pedido). Antes disso ficam ocultas (anti-retaliação).
 */
export function shouldReveal(reviewCount: number): boolean {
  return reviewCount >= 2;
}

/** Média das notas reveladas (arredondada a 2 casas); 0 sem avaliações. */
export function averageRating(notas: number[]): number {
  if (notas.length === 0) return 0;
  const soma = notas.reduce((acc, n) => acc + n, 0);
  return Math.round((soma / notas.length) * 100) / 100;
}

/** Janela fechada quando o instante atual alcança/ultrapassa o prazo. */
export function isWindowClosed(prazoEm: Date, now: Date): boolean {
  return now.getTime() >= prazoEm.getTime();
}
