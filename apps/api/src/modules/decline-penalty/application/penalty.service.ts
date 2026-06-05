import { Inject, Injectable } from "@nestjs/common";
import { DeclineReason, type Penalty, type PenaltySummary } from "@obracerta/shared";
import { AuditService } from "../../audit/application/audit.service.js";
import {
  PenaltyReason,
  computeAcceptanceRate,
  declineToPenaltyReason,
  escalatePoints,
} from "../domain/penalty-rules.js";
import {
  PENALTY_REPOSITORY,
  type PenaltyRepository,
} from "../domain/ports/penalty.repository.js";

@Injectable()
export class PenaltyService {
  constructor(
    @Inject(PENALTY_REPOSITORY) private readonly repo: PenaltyRepository,
    private readonly audit: AuditService,
  ) {}

  /** Penaliza uma recusa, se o motivo for penalizável. Devolve a penalidade ou null. */
  penalizeDecline(
    professionalId: string,
    bookingId: string,
    reason: DeclineReason,
    detalhe: string | null,
  ): Promise<Penalty | null> {
    const penaltyReason = declineToPenaltyReason(reason);
    if (!penaltyReason) return Promise.resolve(null);
    return this.apply(professionalId, bookingId, penaltyReason, detalhe);
  }

  /** Penaliza a expiração (não respondeu em 24h). */
  penalizeExpiration(professionalId: string, bookingId: string): Promise<Penalty | null> {
    return this.apply(professionalId, bookingId, PenaltyReason.NAO_RESPONDEU, null);
  }

  /** Resumo de comportamento do profissional (taxa de aceitação + pontos). */
  async getSummary(professionalId: string): Promise<PenaltySummary> {
    const [counts, pontosPenalidade] = await Promise.all([
      this.repo.bookingCounts(professionalId),
      this.repo.sumPoints(professionalId),
    ]);
    return {
      totalPedidos: counts.total,
      aprovados: counts.aprovados,
      recusados: counts.recusados,
      expirados: counts.expirados,
      taxaAceitacao: computeAcceptanceRate(counts.aprovados, counts.recusados, counts.expirados),
      pontosPenalidade,
    };
  }

  listForProfessional(professionalId: string): Promise<Penalty[]> {
    return this.repo.listForProfessional(professionalId);
  }

  /** Aplica a penalidade com escala por reincidência e registra na auditoria. */
  private async apply(
    professionalId: string,
    bookingId: string,
    reason: PenaltyReason,
    detalhe: string | null,
  ): Promise<Penalty> {
    const prior = await this.repo.countForProfessional(professionalId);
    const pontos = escalatePoints(reason, prior);
    const penalty = await this.repo.create({
      professionalId,
      bookingId,
      motivo: reason,
      pontos,
      detalhe,
    });
    await this.audit.record({
      atorUserId: null,
      acao: "PENALIDADE_APLICADA",
      entidade: "professional",
      entidadeId: professionalId,
      dados: { motivo: reason, pontos, bookingId },
    });
    return penalty;
  }
}
