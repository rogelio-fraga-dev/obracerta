import { Controller, Get, UseGuards } from "@nestjs/common";
import type { JwtClaims, Penalty, PenaltySummary } from "@obracerta/shared";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { PenaltyService } from "../application/penalty.service.js";

@Controller("penalties")
@UseGuards(JwtAuthGuard)
export class PenaltyController {
  constructor(private readonly penalties: PenaltyService) {}

  /** Resumo de comportamento do profissional autenticado (taxa + pontos). */
  @Get("me/summary")
  summary(@CurrentUser() user: JwtClaims): Promise<PenaltySummary> {
    return this.penalties.getSummary(user.sub);
  }

  /** Penalidades do profissional autenticado. */
  @Get("me")
  list(@CurrentUser() user: JwtClaims): Promise<Penalty[]> {
    return this.penalties.listForProfessional(user.sub);
  }
}
