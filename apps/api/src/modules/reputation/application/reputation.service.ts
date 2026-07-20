import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  BookingReviewStatus,
  CreateReviewInput,
  CreateReviewResponseInput,
  ReceivedReview,
  ReputationEvent,
  ReputationSummary,
  Review,
  ReviewResponse,
} from "@obracerta/shared";
import { AuditService } from "../../audit/application/audit.service.js";
import { BookingService } from "../../booking/application/booking.service.js";
import {
  averageRating,
  canReviewStatus,
  reviewDeadline,
  reviewParticipant,
  shouldReveal,
} from "../domain/review-rules.js";
import { computeBadges, reconcileBadges } from "../domain/badge-rules.js";
import { checkCanRespond } from "../domain/response-rules.js";
import { REVIEW_REPOSITORY, type ReviewRepository } from "../domain/ports/review.repository.js";
import { BADGE_REPOSITORY, type BadgeRepository } from "../domain/ports/badge.repository.js";
import {
  REVIEW_RESPONSE_REPOSITORY,
  type ReviewResponseRepository,
} from "../domain/ports/review-response.repository.js";
import {
  REPUTATION_EVENT_REPOSITORY,
  type ReputationEventRepository,
} from "../domain/ports/reputation-event.repository.js";
import { ReputationScheduler } from "./reputation.scheduler.js";
import { STORAGE_PORT, type StoragePort } from "../../storage/domain/storage.port.js";
import { IMAGE_MIME, sniffImageExt } from "../../../common/uploads/image-upload.js";

@Injectable()
export class ReputationService {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly repo: ReviewRepository,
    @Inject(BADGE_REPOSITORY) private readonly badges: BadgeRepository,
    @Inject(REVIEW_RESPONSE_REPOSITORY) private readonly responses: ReviewResponseRepository,
    @Inject(REPUTATION_EVENT_REPOSITORY) private readonly events: ReputationEventRepository,
    private readonly bookings: BookingService,
    private readonly scheduler: ReputationScheduler,
    private readonly audit: AuditService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  /**
   * Anexa a foto do serviço concluído à avaliação do próprio autor (prova
   * social). A nota/comentário são imutáveis; a foto é metadado adicional.
   */
  async attachReviewPhoto(
    authorId: string,
    reviewId: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<Review> {
    const ext = sniffImageExt(file.buffer);
    if (!ext) throw new BadRequestException("Formato inválido. Use JPEG, PNG ou WebP.");
    const key = `reviews/${reviewId}/servico-${Date.now()}.${ext}`;
    const url = await this.storage.putObject(key, file.buffer, IMAGE_MIME[ext]);
    const updated = await this.repo.setFoto(reviewId, authorId, url);
    if (!updated) throw new NotFoundException("Avaliação não encontrada.");
    return updated;
  }

  /**
   * Registra a avaliação do autor sobre a contraparte de um pedido CONCLUIDO.
   * A nota nasce PENDENTE (oculta). Se o outro lado já avaliou, revela o par na
   * hora (revelação simultânea); senão, agenda a revelação por janela (7d).
   */
  async createReview(authorId: string, input: CreateReviewInput): Promise<Review> {
    // autoriza: só participantes do pedido (também valida que o pedido existe)
    const booking = await this.bookings.getForParticipant(authorId, input.bookingId);
    if (!canReviewStatus(booking.status)) {
      throw new ConflictException("Só é possível avaliar um pedido concluído.");
    }

    const participant = reviewParticipant(authorId, booking.contractorId, booking.professionalId);
    if (!participant) throw new ForbiddenException("Você não participa deste pedido.");

    const existing = await this.repo.findByBookingAndAuthor(input.bookingId, authorId);
    if (existing) throw new ConflictException("Você já avaliou este pedido.");

    // janela ancorada na conclusão (booking.atualizadoEm = instante do CONCLUIDO,
    // pois nenhuma transição ocorre depois). Modelar um `concluido_em` é refinamento futuro.
    const prazoEm = reviewDeadline(new Date(booking.atualizadoEm)).toISOString();
    const review = await this.repo.create({
      bookingId: input.bookingId,
      autorId: authorId,
      alvoId: participant.alvoId,
      papelAutor: participant.papelAutor,
      nota: input.nota,
      comentario: input.comentario ?? null,
      fotoUrl: null,
      prazoEm,
    });

    // revelação simultânea: se ambos avaliaram, revela o par agora
    const total = await this.repo.countForBooking(input.bookingId);
    if (shouldReveal(total)) {
      const alvos = await this.repo.revealPending(input.bookingId);
      await this.onRevealed(input.bookingId, alvos);
    }

    // garante a revelação por janela mesmo que o outro lado nunca avalie (idempotente)
    await this.scheduler.scheduleReveal(input.bookingId, prazoEm);

    await this.audit.record({
      atorUserId: authorId,
      acao: "AVALIACAO_CRIADA",
      entidade: "booking",
      entidadeId: input.bookingId,
      dados: { alvoId: participant.alvoId, papel: participant.papelAutor },
    });

    return review;
  }

  /** Revela as avaliações PENDENTE de um pedido (chamado pelo job de janela). */
  async revealForBooking(bookingId: string): Promise<number> {
    const alvos = await this.repo.revealPending(bookingId);
    await this.onRevealed(bookingId, alvos);
    return alvos.length;
  }

  /** Trilha de reputação do usuário (eventos append-only: avaliações, badges). */
  listEvents(userId: string): Promise<ReputationEvent[]> {
    return this.events.listForUser(userId);
  }

  /**
   * Pós-revelação: registra o evento AVALIACAO_REVELADA por alvo na trilha
   * (`reputation_events`) e recalcula os badges.
   */
  private async onRevealed(bookingId: string, alvoIds: string[]): Promise<void> {
    for (const alvoId of new Set(alvoIds)) {
      await this.events.append({
        userId: alvoId,
        tipo: "AVALIACAO_REVELADA",
        referenciaId: bookingId,
        dados: null,
      });
    }
    await this.recomputeBadges(alvoIds);
  }

  /** Reputação pública de um usuário: nº de avaliações reveladas + média + badges. */
  async getReputation(alvoId: string): Promise<ReputationSummary> {
    const [notas, badges] = await Promise.all([
      this.repo.revealedRatingsForTarget(alvoId),
      this.badges.listActiveCodes(alvoId),
    ]);
    return {
      totalAvaliacoes: notas.length,
      mediaNota: averageRating(notas),
      badges,
    };
  }

  /**
   * Avaliações reveladas recebidas por um usuário (alvo), já enriquecidas com a
   * resposta pública (se houver) — assim a UI sabe quando esconder o formulário de
   * resposta sem um fetch por avaliação.
   */
  async listReceived(alvoId: string): Promise<ReceivedReview[]> {
    const reviews = await this.repo.listRevealedForTarget(alvoId);
    if (reviews.length === 0) return [];
    const responses = await this.responses.findByReviews(reviews.map((r) => r.id));
    const byReviewId = new Map(responses.map((resp) => [resp.reviewId, resp]));
    return reviews.map((r) => {
      const resp = byReviewId.get(r.id);
      return { ...r, resposta: resp?.texto ?? null, respostaEm: resp?.criadoEm ?? null };
    });
  }

  /** O usuário autenticado já avaliou este pedido? (controla o form na tela do pedido). */
  async hasReviewedBooking(authorId: string, bookingId: string): Promise<BookingReviewStatus> {
    const existing = await this.repo.findByBookingAndAuthor(bookingId, authorId);
    return { jaAvaliou: existing !== null };
  }

  /** Busca uma avaliação por id (usado pela moderação para achar o ofensor). */
  getReview(id: string): Promise<Review | null> {
    return this.repo.findById(id);
  }

  /** Oculta uma avaliação (moderação: denúncia/decisão procedente). */
  hideReview(id: string): Promise<void> {
    return this.repo.hide(id);
  }

  /** Restaura uma avaliação oculta (moderação: precaução expirada/improcedente). */
  restoreReview(id: string): Promise<void> {
    return this.repo.restore(id);
  }

  /**
   * Direito de resposta pública (roadmap §12): o AVALIADO responde 1x à avaliação
   * revelada, dentro de 30 dias da revelação.
   */
  async respondToReview(
    responderId: string,
    input: CreateReviewResponseInput,
  ): Promise<ReviewResponse> {
    const review = await this.repo.findById(input.reviewId);
    if (!review) throw new NotFoundException("Avaliação não encontrada.");

    const existing = await this.responses.findByReview(input.reviewId);
    const check = checkCanRespond({
      status: review.status,
      alvoId: review.alvoId,
      responderId,
      reveladaEm: review.reveladaEm ? new Date(review.reveladaEm) : null,
      now: new Date(),
      hasResponse: existing !== null,
    });
    if (check !== "OK") throw this.respondError(check);

    const response = await this.responses.create({
      reviewId: input.reviewId,
      autorId: responderId,
      texto: input.texto,
    });
    await this.audit.record({
      atorUserId: responderId,
      acao: "RESPOSTA_PUBLICADA",
      entidade: "review",
      entidadeId: input.reviewId,
      dados: null,
    });
    return response;
  }

  /** Traduz a recusa do domínio na exceção HTTP adequada. */
  private respondError(check: Exclude<ReturnType<typeof checkCanRespond>, "OK">): Error {
    switch (check) {
      case "NAO_REVELADA":
        return new ConflictException("A avaliação ainda não foi revelada.");
      case "NAO_E_ALVO":
        return new ForbiddenException("Só o avaliado pode responder a esta avaliação.");
      case "JANELA_EXPIRADA":
        return new GoneException("O prazo de 30 dias para responder expirou.");
      case "JA_RESPONDIDA":
        return new ConflictException("Esta avaliação já foi respondida.");
      default:
        return new BadRequestException("Não é possível responder a esta avaliação.");
    }
  }

  /**
   * Recalcula os badges automáticos dos alvos afetados por uma revelação (concede
   * os merecidos, revoga os que deixaram de ser). Badges manuais/legados ficam intactos.
   */
  private async recomputeBadges(alvoIds: string[]): Promise<void> {
    const unicos = [...new Set(alvoIds)];
    for (const alvoId of unicos) {
      const notas = await this.repo.revealedRatingsForTarget(alvoId);
      const earned = computeBadges(notas.length, averageRating(notas));
      const active = await this.badges.listActiveCodes(alvoId);
      const { toGrant, toRevoke } = reconcileBadges(active, earned);
      for (const codigo of toGrant) {
        await this.badges.grant(alvoId, codigo);
        await this.events.append({
          userId: alvoId,
          tipo: "BADGE_CONCEDIDO",
          referenciaId: codigo,
          dados: null,
        });
        await this.audit.record({
          atorUserId: null,
          acao: "BADGE_CONCEDIDO",
          entidade: "user",
          entidadeId: alvoId,
          dados: { codigo },
        });
      }
      for (const codigo of toRevoke) {
        await this.badges.revoke(alvoId, codigo);
        await this.events.append({
          userId: alvoId,
          tipo: "BADGE_REVOGADO",
          referenciaId: codigo,
          dados: null,
        });
        await this.audit.record({
          atorUserId: null,
          acao: "BADGE_REVOGADO",
          entidade: "user",
          entidadeId: alvoId,
          dados: { codigo },
        });
      }
    }
  }
}
