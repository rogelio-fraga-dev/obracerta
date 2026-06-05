import { Inject, Injectable } from "@nestjs/common";
import type {
  AvailabilitySlot,
  CalendarDay,
  SetAvailabilityInput,
} from "@obracerta/shared";
import { projectCalendar } from "../domain/calendar.js";
import { dedupeSlots } from "../domain/grade.js";
import {
  AVAILABILITY_REPOSITORY,
  type AvailabilityRepository,
} from "../domain/ports/availability.repository.js";

const DEFAULT_PROJECTION_MONTHS = 6;

@Injectable()
export class AvailabilityService {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY) private readonly repo: AvailabilityRepository,
  ) {}

  /** Grade semanal do profissional. */
  getGrade(professionalId: string): Promise<AvailabilitySlot[]> {
    return this.repo.getAvailability(professionalId);
  }

  /** Substitui a grade semanal inteira (idempotente; faixas deduplicadas). */
  setGrade(professionalId: string, input: SetAvailabilityInput): Promise<AvailabilitySlot[]> {
    return this.repo.setAvailability(professionalId, dedupeSlots(input.slots));
  }

  /**
   * Calendário projetado (grade − bloqueios) a partir de hoje, por N meses
   * (limitado a 6 no domínio).
   */
  async getCalendario(
    professionalId: string,
    months = DEFAULT_PROJECTION_MONTHS,
    fromDate = new Date(),
  ): Promise<CalendarDay[]> {
    const [slots, blocks] = await Promise.all([
      this.repo.getAvailability(professionalId),
      this.repo.listBlocks(professionalId),
    ]);
    return projectCalendar(slots, blocks, fromDate, months);
  }
}
