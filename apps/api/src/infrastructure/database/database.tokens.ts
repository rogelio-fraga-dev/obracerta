/**
 * Tokens de injeção da camada de banco. Usar Symbols evita colisão e deixa
 * claro que são pontos de extensão (ports) — não classes concretas.
 */
export const PG_POOL = Symbol("PG_POOL");
export const DRIZZLE = Symbol("DRIZZLE");
