import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PenaltyService } from "./application/penalty.service.js";
import { PENALTY_REPOSITORY } from "./domain/ports/penalty.repository.js";
import { DrizzlePenaltyRepository } from "./infrastructure/drizzle-penalty.repository.js";
import { PenaltyController } from "./interface/penalty.controller.js";

/**
 * Penalidades por recusa injustificada / não-resposta (roadmap §8, Etapa 2.4).
 * Classificação + escala no domínio; aplica e audita (AuditModule). Exporta o
 * PenaltyService para o BookingModule disparar a penalidade no decline/expiração.
 */
@Module({
  imports: [AuthModule, AuditModule],
  controllers: [PenaltyController],
  providers: [
    PenaltyService,
    { provide: PENALTY_REPOSITORY, useClass: DrizzlePenaltyRepository },
  ],
  exports: [PenaltyService],
})
export class DeclinePenaltyModule {}
