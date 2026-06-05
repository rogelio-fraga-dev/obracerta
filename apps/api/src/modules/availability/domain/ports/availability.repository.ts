import type {
  AvailabilitySlot,
  CreateAvailabilitySlotInput,
  ScheduleBlock,
} from "@obracerta/shared";

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
}

export const AVAILABILITY_REPOSITORY = Symbol("AVAILABILITY_REPOSITORY");
