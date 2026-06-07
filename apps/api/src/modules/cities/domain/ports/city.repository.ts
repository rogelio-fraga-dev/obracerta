import type { City } from "@obracerta/shared";

/** Token DI da porta de cidades. */
export const CITY_REPOSITORY = Symbol("CITY_REPOSITORY");

/** Porta de leitura de cidades (dado de referência). */
export interface CityRepository {
  /** Cidades ativas, ordenadas por nome. */
  listActive(): Promise<City[]>;
}
