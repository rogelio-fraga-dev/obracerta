import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  searchProfessionalsQuerySchema,
  type SearchProfessionalsQuery,
  type SearchProfessionalsResult,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { SearchService } from "../application/search.service.js";

@Controller("search")
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  /** Busca de profissionais: texto (q) + especialidade + plano + geo (lat/lng/raioKm), paginada. */
  @Get("professionals")
  professionals(
    @Query(new ZodValidationPipe(searchProfessionalsQuerySchema)) query: SearchProfessionalsQuery,
  ): Promise<SearchProfessionalsResult> {
    return this.search.searchProfessionals(query);
  }
}
