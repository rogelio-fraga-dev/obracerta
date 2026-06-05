import { Inject, Injectable } from "@nestjs/common";
import { sql, type SQL } from "drizzle-orm";
import type { ProfessionalPlan, SearchResult } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import type {
  SearchPage,
  SearchProfessionalsFilters,
  SearchRepository,
} from "../domain/ports/search.repository.js";

interface SearchRow {
  user_id: string;
  nome: string;
  slug: string;
  especialidades: string[];
  bairro: string | null;
  plano: string;
  anos_experiencia: number | null;
  foto_url: string | null;
  distancia_km: string | number | null;
}

@Injectable()
export class DrizzleSearchRepository implements SearchRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Busca profissionais combinando filtro por especialidade (GIN `@>`), texto no
   * nome (GIN pg_trgm `ILIKE`), plano e raio geográfico (`ST_DWithin` sobre o índice
   * GIST, em metros via `::geography`). Ordena por distância quando geo, senão por nome.
   */
  async searchProfessionals(f: SearchProfessionalsFilters): Promise<SearchPage> {
    const point = f.geo
      ? sql`ST_SetSRID(ST_MakePoint(${f.geo.lng}, ${f.geo.lat}), 4326)`
      : null;

    const conds: SQL[] = [sql`u.status = 'ATIVO'`];
    if (f.especialidade) conds.push(sql`pp.especialidades @> ARRAY[${f.especialidade}]::text[]`);
    if (f.plano) conds.push(sql`pp.plano = ${f.plano}`);
    if (f.q) conds.push(sql`u.nome_completo ilike ${`%${f.q}%`}`);
    if (point) {
      conds.push(sql`pp.geo is not null and ST_DWithin(pp.geo::geography, ${point}::geography, ${f.geo!.raioKm * 1000})`);
    }
    const where = sql.join(conds, sql` and `);

    const distancia = point
      ? sql`round((ST_Distance(pp.geo::geography, ${point}::geography) / 1000)::numeric, 2)`
      : sql`null`;
    const orderBy = point ? sql`distancia_km asc nulls last, u.nome_completo` : sql`u.nome_completo`;

    const result = await this.db.execute(sql`
      select u.id as user_id, u.nome_completo as nome, pp.slug_publico as slug,
             pp.especialidades, pp.bairro, pp.plano, pp.anos_experiencia, pp.foto_url,
             ${distancia} as distancia_km
      from professional_profiles pp
      join users u on u.id = pp.user_id
      where ${where}
      order by ${orderBy}
      limit ${f.limit} offset ${f.offset}
    `);

    const countResult = await this.db.execute(sql`
      select count(*)::int as total
      from professional_profiles pp
      join users u on u.id = pp.user_id
      where ${where}
    `);

    const totalRow = countResult.rows[0] as { total: number } | undefined;
    return {
      items: (result.rows as unknown as SearchRow[]).map(rowToSearchResult),
      total: Number(totalRow?.total ?? 0),
    };
  }
}

function rowToSearchResult(row: SearchRow): SearchResult {
  return {
    userId: row.user_id,
    nome: row.nome,
    slug: row.slug,
    especialidades: row.especialidades ?? [],
    bairro: row.bairro,
    plano: row.plano as ProfessionalPlan,
    anosExperiencia: row.anos_experiencia,
    fotoUrl: row.foto_url,
    distanciaKm: row.distancia_km === null ? null : Number(row.distancia_km),
  };
}
