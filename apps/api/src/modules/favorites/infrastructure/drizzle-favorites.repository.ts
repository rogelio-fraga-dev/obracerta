import { Inject, Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import type { ProfessionalPlan, SearchResult } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { favorites } from "../../../infrastructure/database/schema/favorites.js";
import type { FavoritesRepository } from "../domain/ports/favorites.repository.js";

interface FavoriteRow {
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
}

@Injectable()
export class DrizzleFavoritesRepository implements FavoritesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async add(userId: string, professionalId: string): Promise<void> {
    await this.db
      .insert(favorites)
      .values({ userId, professionalId })
      .onConflictDoNothing();
  }

  async remove(userId: string, professionalId: string): Promise<void> {
    await this.db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.professionalId, professionalId)));
  }

  /** Mesmo select da busca, escopado aos favoritos (reputação incluída). */
  async listProfessionals(userId: string): Promise<SearchResult[]> {
    const result = await this.db.execute(sql`
      select u.id as user_id, u.nome_completo as nome, pp.slug_publico as slug,
             pp.especialidades, pp.bairro, pp.plano, pp.anos_experiencia, pp.foto_url,
             coalesce(r.media, 0) as media_nota, coalesce(r.total, 0) as total_avaliacoes
      from favorites f
      join professional_profiles pp on pp.user_id = f.professional_id
      join users u on u.id = f.professional_id
      left join (
        select alvo_id, avg(nota)::numeric(3,2) as media, count(*)::int as total
        from reviews where status = 'REVELADA' group by alvo_id
      ) r on r.alvo_id = u.id
      where f.user_id = ${userId} and u.status = 'ATIVO'
      order by f.criado_em desc
    `);
    return (result.rows as unknown as FavoriteRow[]).map((row) => ({
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
      distanciaKm: null,
    }));
  }

  async idsForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ professionalId: favorites.professionalId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    return rows.map((r) => r.professionalId);
  }

  async professionalExists(professionalId: string): Promise<boolean> {
    const result = await this.db.execute(sql`
      select 1 from professional_profiles where user_id = ${professionalId} limit 1
    `);
    return result.rows.length > 0;
  }
}
