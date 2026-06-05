import type {
  AvailabilitySlot,
  CreateAvailabilitySlotInput,
  ScheduleBlock,
} from "@obracerta/shared";

/** Dados para criar um bloqueio de período (obra aprovada ou bloqueio manual). */
export interface CreateScheduleBlockData {
  professionalId: string;
  inicio: string; // ISO
  fim: string; // ISO
  bookingId: string | null;
  motivo: string | null;
}

/** Porta de saída para a agenda do profissional (grade semanal + bloqueios). */
export interface AvailabilityRepository {
  /** Lê a grade semanal do profissional, ordenada por dia/horário. */
  getAvailability(professionalId: string): Promise<AvailabilitySlot[]>;
  /**
   * Substitui a grade semanal inteira de forma idempotente (apaga e reinsere
   * numa transação). Espera as faixas já deduplicadas pelo domínio.
   */
  setAvailability(
    professionalId: string,
    slots: CreateAvailabilitySlotInput[],
  ): Promise<AvailabilitySlot[]>;
  /** Lista os bloqueios de período do profissional, ordenados por início. */
  listBlocks(professionalId: string): Promise<ScheduleBlock[]>;
  /** Cria um bloqueio de período (ex.: gerado na aprovação de um booking). */
  createBlock(data: CreateScheduleBlockData): Promise<ScheduleBlock>;
  /** Remove os bloqueios derivados de um booking (compensação/cancelamento). */
  deleteBlocksForBooking(bookingId: string): Promise<void>;
}

export const AVAILABILITY_REPOSITORY = Symbol("AVAILABILITY_REPOSITORY");
