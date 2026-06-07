import { Module } from "@nestjs/common";
import { CitiesService } from "./application/cities.service.js";
import { CITY_REPOSITORY } from "./domain/ports/city.repository.js";
import { DrizzleCityRepository } from "./infrastructure/drizzle-city.repository.js";
import { CitiesController } from "./interface/cities.controller.js";

/**
 * Cidades (dado de referência, roadmap §4.1). Lista pública read-only consumida
 * ao abrir uma obra (Fase 5) e no cadastro.
 */
@Module({
  controllers: [CitiesController],
  providers: [CitiesService, { provide: CITY_REPOSITORY, useClass: DrizzleCityRepository }],
  exports: [CitiesService],
})
export class CitiesModule {}
