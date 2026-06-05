import { ConflictException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { CreateReviewInput, ReputationSummary, Review } from "@obracerta/shared";
import { AuditService } from "../../audit/application/audit.service.js";
import { BookingService } from "../../booking/application/booking.service.js";
import {
  averageRating,
  canReviewStatus,
  reviewDeadline,
  reviewParticipant,
  shouldReveal,
} from "../domain/review-rules.js";
import { REVIEW_REPOSITORY, type ReviewRepository } from "../domain/ports/review.repository.js";
import { ReputationScheduler } from "./reputation.scheduler.js";

@Injectable()
export class ReputationService {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly repo: ReviewRepository,
    private readonly bookings: BookingService,
    private readonly scheduler: ReputationScheduler,
    private readonly audit: AuditService,
  ) {}

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
      prazoEm,
    });

    // revelação simultânea: se ambos avaliaram, revela o par agora
    const total = await this.repo.countForBooking(input.bookingId);
    if (shouldReveal(total)) await this.repo.revealPending(input.bookingId);

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
  revealForBooking(bookingId: string): Promise<number> {
    return this.repo.revealPending(bookingId);
  }

  /** Reputação pública de um usuário: nº de avaliações reveladas + média. */
  async getReputation(alvoId: string): Promise<ReputationSummary> {
    const notas = await this.repo.revealedRatingsForTarget(alvoId);
    return {
      totalAvaliacoes: notas.length,
      mediaNota: averageRating(notas),
      badges: [], // badges entram na Etapa 3.2
    };
  }

  /** Avaliações reveladas recebidas por um usuário (alvo). */
  listReceived(alvoId: string): Promise<Review[]> {
    return this.repo.listRevealedForTarget(alvoId);
  }
}
