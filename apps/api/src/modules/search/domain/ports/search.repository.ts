import type { SearchResult } from "@obracerta/shared";
import type { GeoFilter } from "../search-rules.js";

/** Filtros normalizados da busca de profissionais. */
export interface SearchProfessionalsFilters {
  q: string | null;
  especialidade: string | null;
  plano: string | null;
  geo: GeoFilter | null;
  limit: number;
  offset: number;
}

/** Página de resultados + total (para a metadata de paginação). */
export interface SearchPage {
  items: SearchResult[];
  total: number;
}

/** Porta de saída da busca (consulta read-only sobre profissionais). */
export interface SearchRepository {
  searchProfessionals(filters: SearchProfessionalsFilters): Promise<SearchPage>;
}

export const SEARCH_REPOSITORY = Symbol("SEARCH_REPOSITORY");
