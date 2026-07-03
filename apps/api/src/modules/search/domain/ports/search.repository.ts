import type { SearchOrder, SearchResult } from "@obracerta/shared";
import type { GeoFilter } from "../search-rules.js";

/** Filtros normalizados da busca de profissionais. */
export interface SearchProfessionalsFilters {
  q: string | null;
  especialidade: string | null;
  plano: string | null;
  geo: GeoFilter | null;
  /** Nota média mínima (avaliações reveladas). */
  notaMin: number | null;
  ordem: SearchOrder;
  limit: number;
  offset: number;
}

/** Página de resultados + total (para a metadata de paginação). */
export interface SearchPage {
  items: SearchResult[];
  total: number;
}

/** Agregado bruto da faixa de preço (mediana/min/max em centavos + nº de lances). */
export interface PriceAggregate {
  minCentavos: number;
  medianaCentavos: number;
  maxCentavos: number;
  amostras: number;
}

/** Porta de saída da busca (consulta read-only sobre profissionais). */
export interface SearchRepository {
  searchProfessionals(filters: SearchProfessionalsFilters): Promise<SearchPage>;
  /** Estatística anônima dos lances por especialidade (null sem dados). */
  priceReference(especialidade: string): Promise<PriceAggregate | null>;
}

export const SEARCH_REPOSITORY = Symbol("SEARCH_REPOSITORY");
