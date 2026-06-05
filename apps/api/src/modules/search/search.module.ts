import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { SearchService } from "./application/search.service.js";
import { SEARCH_REPOSITORY } from "./domain/ports/search.repository.js";
import { DrizzleSearchRepository } from "./infrastructure/drizzle-search.repository.js";
import { SearchController } from "./interface/search.controller.js";

/**
 * Busca de profissionais (roadmap §17, Etapa 5.1). Texto (pg_trgm) + geo (PostGIS
 * `ST_DWithin`) + filtros por especialidade/plano, paginado. Consulta read-only.
 */
@Module({
  imports: [AuthModule],
  controllers: [SearchController],
  providers: [SearchService, { provide: SEARCH_REPOSITORY, useClass: DrizzleSearchRepository }],
  exports: [SearchService],
})
export class SearchModule {}
