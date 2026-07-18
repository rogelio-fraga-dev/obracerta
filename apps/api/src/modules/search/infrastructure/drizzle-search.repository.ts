import { Inject, Injectable } from "@nestjs/common";
import { sql, type SQL } from "drizzle-orm";
import type { ProfessionalPlan, SearchResult } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import type {
  PriceAggregate,
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
  media_nota: string | number | null;
  total_avaliacoes: string | number | null;
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
    // nota mínima considera só avaliações REVELADAS (o join `r` existe nos 2 queries)
    if (f.notaMin !== null) conds.push(sql`coalesce(r.media, 0) >= ${f.notaMin}`);
    const where = sql.join(conds, sql` and `);

    const distancia = point
      ? sql`round((ST_Distance(pp.geo::geography, ${point}::geography) / 1000)::numeric, 2)`
      : sql`null`;

    // Peso do plano na ordenação (homologação 18/07): Especialista no topo das
    // buscas, depois Profissional, depois Iniciante.
    const planoRank = sql`case pp.plano when 'ESPECIALISTA' then 0 when 'PRO' then 1 else 2 end`;

    // Ordenação: nota (melhor primeiro), distância (exige geo; senão cai na
    // relevância) ou relevância (plano → distância quando geo → nome). Nas ordens
    // explícitas do usuário (nota/distância) o plano entra como desempate.
    const orderBy =
      f.ordem === "nota"
        ? sql`coalesce(r.media, 0) desc, coalesce(r.total, 0) desc, ${planoRank}, u.nome_completo`
        : f.ordem === "distancia" && point
          ? sql`distancia_km asc nulls last, ${planoRank}, u.nome_completo`
          : point
            ? sql`${planoRank}, distancia_km asc nulls last, u.nome_completo`
            : sql`${planoRank}, u.nome_completo`;

    // reputação: agrega só as avaliações REVELADAS por alvo (LEFT JOIN — 0/0 se nenhuma)
    const reviewsJoin = sql`
      left join (
        select alvo_id, avg(nota)::numeric(3,2) as media, count(*)::int as total
        from reviews where status = 'REVELADA' group by alvo_id
      ) r on r.alvo_id = u.id
    `;

    const result = await this.db.execute(sql`
      select u.id as user_id, u.nome_completo as nome, pp.slug_publico as slug,
             pp.especialidades, pp.bairro, pp.plano, pp.anos_experiencia,
             coalesce(pp.foto_url, u.foto_url) as foto_url,
             coalesce(r.media, 0) as media_nota, coalesce(r.total, 0) as total_avaliacoes,
             ${distancia} as distancia_km
      from professional_profiles pp
      join users u on u.id = pp.user_id
      ${reviewsJoin}
      where ${where}
      order by ${orderBy}
      limit ${f.limit} offset ${f.offset}
    `);

    const countResult = await this.db.execute(sql`
      select count(*)::int as total
      from professional_profiles pp
      join users u on u.id = pp.user_id
      ${reviewsJoin}
      where ${where}
    `);

    const totalRow = countResult.rows[0] as { total: number } | undefined;
    return {
      items: (result.rows as unknown as SearchRow[]).map(rowToSearchResult),
      total: Number(totalRow?.total ?? 0),
    };
  }

  /**
   * Faixa de preço da especialidade: agregado **anônimo** sobre os lances das
   * obras dessa especialidade (mediana via percentile_cont). Nunca expõe lance
   * individual — o sigilo (§lances) segue intacto.
   */
  async priceReference(especialidade: string): Promise<PriceAggregate | null> {
    const result = await this.db.execute(sql`
      select min(p.valor_centavos)::int as min_c,
             percentile_cont(0.5) within group (order by p.valor_centavos)::int as med_c,
             max(p.valor_centavos)::int as max_c,
             count(*)::int as amostras
      from proposals p
      join work_orders w on w.id = p.work_order_id
      where w.especialidade = ${especialidade}
    `);
    const row = result.rows[0] as
      | { min_c: number | null; med_c: number | null; max_c: number | null; amostras: number }
      | undefined;
    if (!row || !row.min_c || !row.med_c || !row.max_c || Number(row.amostras) === 0) return null;
    return {
      minCentavos: Number(row.min_c),
      medianaCentavos: Number(row.med_c),
      maxCentavos: Number(row.max_c),
      amostras: Number(row.amostras),
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
    mediaNota: Number(row.media_nota ?? 0),
    totalAvaliacoes: Number(row.total_avaliacoes ?? 0),
    distanciaKm: row.distancia_km === null ? null : Number(row.distancia_km),
  };
}
