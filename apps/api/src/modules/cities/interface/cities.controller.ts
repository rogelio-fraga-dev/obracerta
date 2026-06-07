import { Controller, Get } from "@nestjs/common";
import type { City } from "@obracerta/shared";
import { CitiesService } from "../application/cities.service.js";

/** Lista pública de cidades (read-only, sem auth) — descoberta/abertura de obra. */
@Controller("cities")
export class CitiesController {
  constructor(private readonly cities: CitiesService) {}

  @Get()
  list(): Promise<City[]> {
    return this.cities.list();
  }
}
