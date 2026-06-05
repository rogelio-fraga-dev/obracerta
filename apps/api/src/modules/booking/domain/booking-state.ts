import type { BookingStatus } from "@obracerta/shared";

/**
 * Domínio puro do agendamento (roadmap §4.2/§7/§11). Máquina de estados +
 * regras de limite/janela, sem framework/ORM. A autorização (quem pode agir)
 * fica no serviço, que conhece contratante/profissional do pedido.
 */

/** Janela de expiração de um pedido PENDENTE. */
export const BOOKING_EXPIRY_HOURS = 24;

/** Máx. de pedidos PENDENTE por especialidade POR CONTRATANTE (anti-spam, §11). */
export const MAX_PENDING_PER_ESPECIALIDADE = 2;

/**
 * Duração padrão do bloqueio de agenda gerado na aprovação. Placeholder até a
 * duração do serviço ser modelada no contrato (hoje só há `dataServico`).
 */
export const DEFAULT_SERVICE_DURATION_HOURS = 2;

/** Transições válidas da máquina de estados. Estado terminal = lista vazia. */
export const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDENTE: ["APROVADO", "RECUSADO", "EXPIRADO", "CANCELADO"],
  APROVADO: ["INICIADO", "CANCELADO"],
  INICIADO: ["CONCLUIDO", "CANCELADO"],
  RECUSADO: [],
  EXPIRADO: [],
  CONCLUIDO: [],
  CANCELADO: [],
};

/** True se `from → to` é uma transição permitida. */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}

/** True se o estado não admite mais nenhuma transição. */
export function isTerminal(status: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[status].length === 0;
}

/** True se já existem pedidos PENDENTE suficientes para barrar mais um. */
export function exceedsPendingLimit(currentPending: number): boolean {
  return currentPending >= MAX_PENDING_PER_ESPECIALIDADE;
}

/** Calcula o instante de expiração a partir da criação (ISO). */
export function computeExpiry(from: Date): string {
  return new Date(from.getTime() + BOOKING_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
}

/** Janela do bloqueio de agenda derivada de `dataServico` (ISO → [inicio, fim]). */
export function serviceBlockWindow(dataServico: string): { inicio: string; fim: string } {
  const inicio = Date.parse(dataServico);
  const fim = inicio + DEFAULT_SERVICE_DURATION_HOURS * 60 * 60 * 1000;
  return { inicio: new Date(inicio).toISOString(), fim: new Date(fim).toISOString() };
}
