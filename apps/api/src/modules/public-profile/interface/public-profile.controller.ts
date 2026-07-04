import { Controller, Get, Param, Query } from "@nestjs/common";
import type { PublicProfile, PublicReviewsPage, RankingEntry } from "@obracerta/shared";
import { PublicProfileService } from "../application/public-profile.service.js";

/**
 * Perfil público (roadmap §18, Etapa 5.2). SEM autenticação — é a página pública
 * (SEO, compartilhável). Retorna a view limitada (anti-desintermediação §24).
 */
@Controller("public")
export class PublicProfileController {
  constructor(private readonly publicProfile: PublicProfileService) {}

  /** Top profissionais por volume de obras e notas. */
  @Get("ranking")
  ranking(): Promise<RankingEntry[]> {
    return this.publicProfile.getRanking();
  }

  /** Avaliações completas e filtradas de um profissional. */
  @Get("p/:slug/reviews")
  async listReviews(
    @Param("slug") slug: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("nota") nota?: string,
  ): Promise<PublicReviewsPage> {
    const p = page ? Math.max(1, parseInt(page, 10)) : 1;
    const l = limit ? Math.max(1, parseInt(limit, 10)) : 10;
    const n = nota ? parseInt(nota, 10) : undefined;
    return this.publicProfile.listReviewsPaginated(slug, p, l, n);
  }

  /** Perfil público por slug (dados limitados + reputação). */
  @Get("p/:slug")
  bySlug(@Param("slug") slug: string): Promise<PublicProfile> {
    return this.publicProfile.getBySlug(slug);
  }
}
