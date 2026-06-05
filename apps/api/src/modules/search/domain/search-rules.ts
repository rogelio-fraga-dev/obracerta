import {
  DEFAULT_SEARCH_RADIUS_KM,
  MAX_SEARCH_RADIUS_KM,
  type PaginationMeta,
} from "@obracerta/shared";

/**
 * Domínio puro da busca (roadmap §17). Normaliza filtros (raio, geo, paginação)
 * antes de bater no banco. Sem framework/ORM.
 */

/** Raio efetivo em km: usa o default quando ausente e satura no máximo. */
export function resolveRadiusKm(raioKm: number | undefined): number {
  const r = raioKm ?? DEFAULT_SEARCH_RADIUS_KM;
  return Math.min(r, MAX_SEARCH_RADIUS_KM);
}

/** Filtro geográfico resolvido (ou null se a busca não é geo). */
export interface GeoFilter {
  lat: number;
  lng: number;
  raioKm: number;
}

/** Liga a busca geográfica só quando lat e lng vêm juntos; resolve o raio. */
export function geoFilter(
  lat: number | undefined,
  lng: number | undefined,
  raioKm: number | undefined,
): GeoFilter | null {
  if (lat === undefined || lng === undefined) return null;
  return { lat, lng, raioKm: resolveRadiusKm(raioKm) };
}

/** Offset da paginação (1-based → 0-based). */
export function offsetFor(page: number, limit: number): number {
  return (page - 1) * limit;
}

/** Monta a metadata de paginação (totalPages arredonda pra cima). */
export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
