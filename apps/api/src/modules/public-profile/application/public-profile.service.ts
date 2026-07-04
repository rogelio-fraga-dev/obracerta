import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  UserStatus,
  type PublicPortfolioPhoto,
  type PublicProfile,
  type PublicReview,
} from "@obracerta/shared";
import { and, eq, sql, count } from "drizzle-orm";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import { PortfolioService } from "../../profiles/application/portfolio.service.js";
import { ProfilesService } from "../../profiles/application/profiles.service.js";
import { Feature, planAllows } from "../../entitlements/domain/entitlements.js";
import { PenaltyService } from "../../decline-penalty/application/penalty.service.js";
import { ReputationService } from "../../reputation/application/reputation.service.js";
import { UsersService } from "../../users/application/users.service.js";
import { nomeParcial, publicFoto, publicName } from "../domain/public-profile-rules.js";

/** Quantas avaliações recentes aparecem no perfil público. */
const PUBLIC_REVIEWS_LIMIT = 5;

@Injectable()
export class PublicProfileService {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly portfolio: PortfolioService,
    private readonly users: UsersService,
    private readonly reputation: ReputationService,
    private readonly penalties: PenaltyService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  /**
   * Monta o perfil público por slug: dados limitados (anti-desintermediação §24) +
   * reputação (Fase 3). Só perfis de contas ATIVAS são públicos.
   */
  async getBySlug(slug: string): Promise<PublicProfile> {
    const profile = await this.profiles.getProfessionalBySlug(slug);
    if (!profile) throw new NotFoundException("Perfil não encontrado.");

    const user = await this.users.findById(profile.userId);
    if (!user || user.status !== UserStatus.ATIVO) {
      throw new NotFoundException("Perfil não encontrado.");
    }

    const [reputacao, avaliacoes, taxaAceitacao, obrasConcluidas] = await Promise.all([
      this.reputation.getReputation(profile.userId),
      this.publicReviews(profile.userId),
      this.acceptanceRate(profile.userId),
      this.countCompletedWorks(profile.userId),
    ]);
    return {
      slug: profile.slugPublico,
      nome: publicName(user.nomeCompleto, profile.plano),
      especialidades: profile.especialidades,
      bairro: profile.bairro,
      anosExperiencia: profile.anosExperiencia,
      plano: profile.plano,
      fotoUrl: publicFoto(profile.fotoUrl ?? user.fotoUrl ?? null, profile.plano),
      portfolio: await this.publicPortfolio(profile.userId, profile.plano),
      reputacao,
      avaliacoes,
      taxaAceitacao,
      obrasConcluidas,
    };
  }

  /**
   * Últimas avaliações reveladas com autor **parcial** (LGPD) + resposta pública.
   * Comentários reais são o maior fator de confiança do segmento.
   */
  private async publicReviews(userId: string): Promise<PublicReview[]> {
    const received = await this.reputation.listReceived(userId);
    const latest = received.slice(0, PUBLIC_REVIEWS_LIMIT);
    const autores = await Promise.all(latest.map((r) => this.users.findById(r.autorId)));
    return latest.map((r, i) => ({
      autorNome: autores[i] ? nomeParcial(autores[i]!.nomeCompleto) : "Contratante",
      nota: r.nota,
      comentario: r.comentario,
      criadoEm: r.criadoEm,
      resposta: r.resposta,
    }));
  }

  /** Taxa de aceitação pública (sinal de "responde rápido"); null sem histórico. */
  private async acceptanceRate(userId: string): Promise<number | null> {
    const summary = await this.penalties.getSummary(userId);
    return summary.taxaAceitacao;
  }

  /**
   * Galeria pública: só aparece se o plano inclui o portfólio (feature
   * `profile.portfolio`). Expõe apenas url + legenda (sem ids internos).
   */
  private async publicPortfolio(
    userId: string,
    plano: PublicProfile["plano"],
  ): Promise<PublicPortfolioPhoto[]> {
    if (!planAllows(plano, Feature.PORTFOLIO)) return [];
    const fotos = await this.portfolio.list(userId);
    return fotos.map((f) => ({ url: f.url, legenda: f.legenda }));
  }

  private async countCompletedWorks(userId: string): Promise<number> {
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

  async getRanking(): Promise<any[]> {
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
      limit 20
    `);
    return res.rows;
  }

  async listReviewsPaginated(
    slug: string,
    page: number,
    limit: number,
    nota?: number,
  ): Promise<{ items: any[]; total: number }> {
    const profile = await this.profiles.getProfessionalBySlug(slug);
    if (!profile) throw new NotFoundException("Perfil não encontrado.");

    const offset = (page - 1) * limit;
    let filterSql = sql`r.alvo_id = ${profile.userId} and r.status = 'REVELADA'`;
    if (nota && nota >= 1 && nota <= 5) {
      filterSql = sql`r.alvo_id = ${profile.userId} and r.status = 'REVELADA' and r.nota = ${nota}`;
    }

    const rowsQuery = this.db.execute(sql`
      select
        r.id,
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
    const total = (countRes.rows[0] as { total: number })?.total ?? 0;

    const items = rowsRes.rows.map((row: any) => ({
      nota: row.nota,
      comentario: row.comentario,
      criadoEm: row.criadoEm instanceof Date ? row.criadoEm.toISOString() : new Date(row.criadoEm).toISOString(),
      autorNome: nomeParcial(row.autorNome),
      resposta: row.resposta || null,
    }));

    return { items, total };
  }
}
