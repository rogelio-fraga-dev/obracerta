import { Inject, Injectable } from "@nestjs/common";
import { and, count, eq, sql } from "drizzle-orm";
import type { RankingEntry } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import type {
  PublicQueryRepository,
  ReviewRow,
} from "../domain/ports/public-query.repository.js";

/** Implementação Drizzle das consultas de leitura do perfil público. */
@Injectable()
export class DrizzlePublicQueryRepository implements PublicQueryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async countCompletedWorks(userId: string): Promise<number> {
    const [c] = await this.db
      .select({ total: count() })
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.professionalId, userId),
          eq(bookingRequests.status, "CONCLUIDO"),
        ),
      );
    return c?.total ?? 0;
  }

  async listRanking(limit: number): Promise<RankingEntry[]> {
    const res = await this.db.execute(sql`
      select
        pp.user_id as "userId",
        pp.slug_publico as "slug",
        pp.foto_url as "fotoUrl",
        u.nome_completo as "nome",
        count(br.id)::int as "obrasConcluidas",
        coalesce(avg(rv.nota), 0)::float as "mediaNota",
        count(distinct rv.id)::int as "totalAvaliacoes"
      from professional_profiles pp
      inner join users u on pp.user_id = u.id
      left join booking_requests br on pp.user_id = br.professional_id and br.status = 'CONCLUIDO'
      left join reviews rv on pp.user_id = rv.alvo_id and rv.status = 'REVELADA'
      where u.status = 'ATIVO'
      group by pp.user_id, pp.slug_publico, pp.foto_url, u.nome_completo
      order by "obrasConcluidas" desc, "mediaNota" desc, "totalAvaliacoes" desc
      limit ${limit}
    `);
    // Cast controlado na fronteira do banco: os aliases/casts do SQL espelham RankingEntry.
    return res.rows as unknown as RankingEntry[];
  }

  async listReviewsPaged(
    userId: string,
    page: number,
    limit: number,
    nota?: number,
  ): Promise<{ items: ReviewRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const filterSql =
      nota && nota >= 1 && nota <= 5
        ? sql`r.alvo_id = ${userId} and r.status = 'REVELADA' and r.nota = ${nota}`
        : sql`r.alvo_id = ${userId} and r.status = 'REVELADA'`;

    const rowsQuery = this.db.execute(sql`
      select
        r.nota,
        r.comentario,
        r.criado_em as "criadoEm",
        u.nome_completo as "autorNome",
        resp.texto as "resposta"
      from reviews r
      inner join users u on r.autor_id = u.id
      left join review_responses resp on r.id = resp.review_id
      where ${filterSql}
      order by r.criado_em desc
      limit ${limit} offset ${offset}
    `);

    const countQuery = this.db.execute(sql`
      select count(*)::int as total
      from reviews r
      where ${filterSql}
    `);

    const [rowsRes, countRes] = await Promise.all([rowsQuery, countQuery]);
    const total = (countRes.rows[0] as { total: number } | undefined)?.total ?? 0;

    const items: ReviewRow[] = rowsRes.rows.map((row) => {
      const r = row as {
        nota: number;
        comentario: string | null;
        criadoEm: string | Date;
        autorNome: string;
        resposta: string | null;
      };
      return {
        nota: r.nota,
        comentario: r.comentario,
        criadoEm:
          r.criadoEm instanceof Date ? r.criadoEm.toISOString() : new Date(r.criadoEm).toISOString(),
        autorNome: r.autorNome,
        resposta: r.resposta ?? null,
      };
    });

    return { items, total };
  }
}
