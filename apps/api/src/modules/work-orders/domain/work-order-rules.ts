import { WorkOrderStatus, WorkUrgency } from "@obracerta/shared";

/**
 * Domínio puro de obras e lances (roadmap §16). Sem framework/ORM: janela de
 * expiração por urgência, piso de dignidade (anti-leilão para baixo), elegibilidade
 * de lance/adjudicação e a regra de sigilo (quem vê quais lances).
 */

/** Janela (horas) até a obra expirar, por urgência. */
export const URGENCY_DEADLINE_HOURS: Record<WorkUrgency, number> = {
  [WorkUrgency.URGENTE]: 48,
  [WorkUrgency.NORMAL]: 7 * 24,
  [WorkUrgency.FLEXIVEL]: 15 * 24,
};

const MS_POR_HORA = 60 * 60 * 1000;

/** Instante de expiração da obra a partir da urgência. */
export function workOrderDeadline(urgencia: WorkUrgency, now: Date): Date {
  return new Date(now.getTime() + URGENCY_DEADLINE_HOURS[urgencia] * MS_POR_HORA);
}

/** Fração da média que define o piso (um lance não pode ficar muito abaixo do mercado). */
export const DIGNITY_FLOOR_FACTOR = 0.7;
/** Mínimo de lances para um piso fazer sentido (antes disso, não há "mercado"). */
export const MIN_BIDS_FOR_FLOOR = 3;

/**
 * Piso de dignidade (roadmap §16): fração da média dos lances. `null` enquanto não
 * houver lances suficientes — sem mercado formado, qualquer valor positivo vale.
 */
export function dignityFloorCentavos(valores: number[]): number | null {
  if (valores.length < MIN_BIDS_FOR_FLOOR) return null;
  const media = valores.reduce((acc, v) => acc + v, 0) / valores.length;
  return Math.round(media * DIGNITY_FLOOR_FACTOR);
}

/** O lance respeita o piso? (sem piso, aceita qualquer valor positivo.) */
export function meetsDignityFloor(valorCentavos: number, floor: number | null): boolean {
  return floor === null || valorCentavos >= floor;
}

/** Só obra ABERTA aceita novos lances. */
export function canSubmitProposal(status: WorkOrderStatus): boolean {
  return status === WorkOrderStatus.ABERTA;
}

/** Só obra ABERTA pode ser adjudicada (aceitar um lance). */
export function canAcceptWorkOrder(status: WorkOrderStatus): boolean {
  return status === WorkOrderStatus.ABERTA;
}

/**
 * Sigilo dos lances (roadmap §16): o dono da obra vê todos; um profissional vê só o
 * próprio; quem não participa não vê nada.
 */
export function visibleProposals<T extends { professionalId: string }>(
  viewerId: string,
  contractorId: string,
  proposals: T[],
): T[] {
  if (viewerId === contractorId) return proposals;
  return proposals.filter((p) => p.professionalId === viewerId);
}
