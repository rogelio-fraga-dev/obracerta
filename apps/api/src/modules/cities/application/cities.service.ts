import { Inject, Injectable } from "@nestjs/common";
import type { City } from "@obracerta/shared";
import { CITY_REPOSITORY, type CityRepository } from "../domain/ports/city.repository.js";

/** Leitura de cidades (dado de referência para abrir obra/cadastro). */
@Injectable()
export class CitiesService {
  constructor(@Inject(CITY_REPOSITORY) private readonly repo: CityRepository) {}

  list(): Promise<City[]> {
    return this.repo.listActive();
  }
}
