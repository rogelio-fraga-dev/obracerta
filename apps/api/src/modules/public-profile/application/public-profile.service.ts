import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  UserStatus,
  type PublicPortfolioPhoto,
  type PublicProfile,
  type PublicReview,
  type PublicReviewsPage,
  type RankingEntry,
} from "@obracerta/shared";
import { PortfolioService } from "../../profiles/application/portfolio.service.js";
import { ProfilesService } from "../../profiles/application/profiles.service.js";
import { Feature, planAllows } from "../../entitlements/domain/entitlements.js";
import { PenaltyService } from "../../decline-penalty/application/penalty.service.js";
import { ReputationService } from "../../reputation/application/reputation.service.js";
import { UsersService } from "../../users/application/users.service.js";
import {
  PUBLIC_QUERY_REPOSITORY,
  type PublicQueryRepository,
} from "../domain/ports/public-query.repository.js";
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
    @Inject(PUBLIC_QUERY_REPOSITORY) private readonly queries: PublicQueryRepository,
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

  private countCompletedWorks(userId: string): Promise<number> {
    return this.queries.countCompletedWorks(userId);
  }

  /** Top 20 profissionais por obras concluídas + reputação. */
  getRanking(): Promise<RankingEntry[]> {
    return this.queries.listRanking(20);
  }

  /**
   * Avaliações públicas paginadas de um profissional. O `autorNome` chega
   * completo do repositório e é mascarado aqui (`nomeParcial`, LGPD).
   */
  async listReviewsPaginated(
    slug: string,
    page: number,
    limit: number,
    nota?: number,
  ): Promise<PublicReviewsPage> {
    const profile = await this.profiles.getProfessionalBySlug(slug);
    if (!profile) throw new NotFoundException("Perfil não encontrado.");

    const { items, total } = await this.queries.listReviewsPaged(
      profile.userId,
      page,
      limit,
      nota,
    );
    return {
      items: items.map((r) => ({
        nota: r.nota,
        comentario: r.comentario,
        criadoEm: r.criadoEm,
        autorNome: nomeParcial(r.autorNome),
        resposta: r.resposta,
      })),
      total,
    };
  }
}
