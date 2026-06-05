import { Body, Controller, Get, Param, Put, Query, UseGuards } from "@nestjs/common";
import {
  type AvailabilitySlot,
  type CalendarDay,
  type JwtClaims,
  type SetAvailabilityInput,
  setAvailabilitySchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { AvailabilityService } from "../application/availability.service.js";

const MAX_PROJECTION_MONTHS = 6;
const DEFAULT_PROJECTION_MONTHS = 6;

/** `meses` da query → inteiro saneado em [1, 6] (default 6). */
function parseMonths(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_PROJECTION_MONTHS;
  return Math.min(n, MAX_PROJECTION_MONTHS);
}

@Controller("availability")
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  /** Grade semanal do usuário autenticado. */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMyGrade(@CurrentUser() user: JwtClaims): Promise<AvailabilitySlot[]> {
    return this.availability.getGrade(user.sub);
  }

  /** Substitui a grade semanal inteira (idempotente). */
  @Put("me")
  @UseGuards(JwtAuthGuard)
  setMyGrade(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(setAvailabilitySchema)) input: SetAvailabilityInput,
  ): Promise<AvailabilitySlot[]> {
    return this.availability.setGrade(user.sub, input);
  }

  /** Calendário projetado (6 meses) do usuário autenticado. */
  @Get("me/calendario")
  @UseGuards(JwtAuthGuard)
  getMyCalendario(
    @CurrentUser() user: JwtClaims,
    @Query("meses") meses?: string,
  ): Promise<CalendarDay[]> {
    return this.availability.getCalendario(user.sub, parseMonths(meses));
  }

  /** Calendário projetado de um profissional (contratante consultando agenda). */
  @Get(":professionalId/calendario")
  @UseGuards(JwtAuthGuard)
  getCalendario(
    @Param("professionalId") professionalId: string,
    @Query("meses") meses?: string,
  ): Promise<CalendarDay[]> {
    return this.availability.getCalendario(professionalId, parseMonths(meses));
  }
}
