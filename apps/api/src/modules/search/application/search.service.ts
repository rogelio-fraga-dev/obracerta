import { Inject, Injectable } from "@nestjs/common";
import type { SearchProfessionalsQuery, SearchProfessionalsResult } from "@obracerta/shared";
import { buildMeta, geoFilter, offsetFor } from "../domain/search-rules.js";
import { SEARCH_REPOSITORY, type SearchRepository } from "../domain/ports/search.repository.js";

@Injectable()
export class SearchService {
  constructor(@Inject(SEARCH_REPOSITORY) private readonly repo: SearchRepository) {}

  /** Busca paginada de profissionais (texto + geo + filtros), §17. */
  async searchProfessionals(query: SearchProfessionalsQuery): Promise<SearchProfessionalsResult> {
    const { page, limit } = query;
    const { items, total } = await this.repo.searchProfessionals({
      q: query.q ?? null,
      especialidade: query.especialidade ?? null,
      plano: query.plano ?? null,
      geo: geoFilter(query.lat, query.lng, query.raioKm),
      limit,
      offset: offsetFor(page, limit),
    });
    return { items, meta: buildMeta(total, page, limit) };
  }
}
