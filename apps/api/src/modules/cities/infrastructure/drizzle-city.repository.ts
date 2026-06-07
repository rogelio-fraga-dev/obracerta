import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import type { City } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { cities } from "../../../infrastructure/database/schema/cities.js";
import type { CityRepository } from "../domain/ports/city.repository.js";

/** Adapter Drizzle da porta de cidades. */
@Injectable()
export class DrizzleCityRepository implements CityRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listActive(): Promise<City[]> {
    return this.db
      .select({ id: cities.id, nome: cities.nome, uf: cities.uf })
      .from(cities)
      .where(eq(cities.ativa, true))
      .orderBy(asc(cities.nome));
  }
}
