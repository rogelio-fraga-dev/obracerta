import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AvailabilityService } from "./application/availability.service.js";
import { AVAILABILITY_REPOSITORY } from "./domain/ports/availability.repository.js";
import { DrizzleAvailabilityRepository } from "./infrastructure/drizzle-availability.repository.js";
import { AvailabilityController } from "./interface/availability.controller.js";

/**
 * Agenda do profissional (roadmap §4.2/§10, Fatia 2.1). Grade semanal + bloqueios;
 * o calendário de 6 meses é projetado no domínio. Importa AuthModule pelo JwtAuthGuard.
 */
@Module({
  imports: [AuthModule],
  controllers: [AvailabilityController],
  providers: [
    AvailabilityService,
    { provide: AVAILABILITY_REPOSITORY, useClass: DrizzleAvailabilityRepository },
  ],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
