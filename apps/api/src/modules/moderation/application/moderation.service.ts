import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ReportStatus,
  SuspensionStatus,
  type AppealSuspensionInput,
  type CreateReportInput,
  type Report,
  type Suspension,
} from "@obracerta/shared";
import { AuditService } from "../../audit/application/audit.service.js";
import { ReputationService } from "../../reputation/application/reputation.service.js";
import {
  appealOutcome,
  canAppeal,
  canResolveReport,
  isSuspensionActive,
  precautionaryHideUntil,
  shouldAutoSuspend,
  suspensionEnd,
} from "../domain/moderation-rules.js";
import { REPORT_REPOSITORY, type ReportRepository } from "../domain/ports/report.repository.js";
import {
  SUSPENSION_REPOSITORY,
  type SuspensionRepository,
} from "../domain/ports/suspension.repository.js";
import { ModerationScheduler } from "./moderation.scheduler.js";

@Injectable()
export class ModerationService {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(SUSPENSION_REPOSITORY) private readonly suspensions: SuspensionRepository,
    private readonly reputation: ReputationService,
    private readonly scheduler: ModerationScheduler,
    private readonly audit: AuditService,
  ) {}

  /**
   * Registra uma denúncia. Denúncia a uma avaliação OCULTA o conteúdo por precaução
   * (48h) e agenda o fim dessa ocultação — se a moderação não decidir até lá, o
   * conteúdo volta (precaução, não veredito).
   */
  async denunciar(denuncianteId: string | null, input: CreateReportInput): Promise<Report> {
    const report = await this.reports.create({
      denuncianteId,
      entidade: input.entidade,
      entidadeId: input.entidadeId,
      motivo: input.motivo,
      detalhe: input.detalhe ?? null,
    });

    if (input.entidade === "REVIEW") {
      await this.reputation.hideReview(input.entidadeId);
      await this.scheduler.scheduleRestore(
        report.id,
        precautionaryHideUntil(new Date()).toISOString(),
      );
    }

    await this.audit.record({
      atorUserId: denuncianteId,
      acao: "DENUNCIA_CRIADA",
      entidade: "report",
      entidadeId: report.id,
      dados: { entidade: input.entidade, entidadeId: input.entidadeId, motivo: input.motivo },
    });
    return report;
  }

  /**
   * Resolve uma denúncia. Procedente: mantém a avaliação oculta e pode disparar
   * suspensão automática do ofensor por reincidência. Improcedente: restaura o conteúdo.
   */
  async resolveReport(reportId: string, procedente: boolean): Promise<Report> {
    const report = await this.reports.findById(reportId);
    if (!report) throw new NotFoundException("Denúncia não encontrada.");
    if (!canResolveReport(report.status)) {
      throw new ConflictException("Esta denúncia já foi resolvida.");
    }

    const novoStatus = procedente ? ReportStatus.PROCEDENTE : ReportStatus.IMPROCEDENTE;
    const updated = await this.reports.setStatus(reportId, novoStatus, true);

    if (report.entidade === "REVIEW") {
      if (procedente) await this.reputation.hideReview(report.entidadeId);
      else await this.reputation.restoreReview(report.entidadeId);
    }

    let suspensaoId: string | null = null;
    if (procedente) {
      const offenderId = await this.resolveOffender(report);
      if (offenderId) {
        const suspension = await this.maybeAutoSuspend(offenderId, reportId);
        suspensaoId = suspension?.id ?? null;
      }
    }

    await this.audit.record({
      atorUserId: null,
      acao: procedente ? "DENUNCIA_PROCEDENTE" : "DENUNCIA_IMPROCEDENTE",
      entidade: "report",
      entidadeId: reportId,
      dados: { suspensaoId },
    });
    return updated ?? report;
  }

  /**
   * Fim da ocultação precaucional (job de 48h): se a denúncia segue ABERTA (sem
   * decisão), restaura o conteúdo e move para EM_ANALISE. Idempotente.
   */
  async liftPrecautionaryHide(reportId: string): Promise<boolean> {
    const report = await this.reports.findById(reportId);
    if (!report || report.status !== ReportStatus.ABERTA) return false;
    if (report.entidade === "REVIEW") {
      await this.reputation.restoreReview(report.entidadeId);
    }
    await this.reports.setStatus(reportId, ReportStatus.EM_ANALISE, false);
    return true;
  }

  /** O usuário suspenso apela (ATIVA → APELADA). */
  async appeal(userId: string, input: AppealSuspensionInput): Promise<Suspension> {
    const suspension = await this.suspensions.findById(input.suspensionId);
    if (!suspension) throw new NotFoundException("Suspensão não encontrada.");
    if (suspension.userId !== userId) throw new ForbiddenException("Esta suspensão não é sua.");
    if (!canAppeal(suspension.status)) {
      throw new ConflictException("Só uma suspensão ativa pode ser apelada.");
    }
    const updated = await this.suspensions.appeal(input.suspensionId, input.texto);
    if (!updated) throw new ConflictException("A suspensão mudou de estado; tente novamente.");

    await this.audit.record({
      atorUserId: userId,
      acao: "SUSPENSAO_APELADA",
      entidade: "suspension",
      entidadeId: input.suspensionId,
      dados: null,
    });
    return updated;
  }

  /** A moderação julga a apelação: deferir revoga; indeferir mantém ativa. */
  async resolveAppeal(suspensionId: string, grant: boolean): Promise<Suspension> {
    const suspension = await this.suspensions.findById(suspensionId);
    if (!suspension) throw new NotFoundException("Suspensão não encontrada.");
    if (suspension.status !== SuspensionStatus.APELADA) {
      throw new ConflictException("Só uma suspensão apelada pode ser julgada.");
    }
    const updated = await this.suspensions.resolve(suspensionId, appealOutcome(grant), grant);

    await this.audit.record({
      atorUserId: null,
      acao: grant ? "SUSPENSAO_REVOGADA" : "APELACAO_NEGADA",
      entidade: "suspension",
      entidadeId: suspensionId,
      dados: null,
    });
    return updated ?? suspension;
  }

  /** A conta está suspensa em vigor? (status ATIVA + dentro do prazo). */
  async isSuspended(userId: string): Promise<boolean> {
    const active = await this.suspensions.activeForUser(userId);
    if (!active) return false;
    return isSuspensionActive(
      active.status,
      active.fimEm ? new Date(active.fimEm) : null,
      new Date(),
    );
  }

  listOpenReports(): Promise<Report[]> {
    return this.reports.listOpen();
  }

  listSuspensions(userId: string): Promise<Suspension[]> {
    return this.suspensions.listForUser(userId);
  }

  /** Identifica o usuário ofensor de uma denúncia procedente. */
  private async resolveOffender(report: Report): Promise<string | null> {
    if (report.entidade === "USER" || report.entidade === "PROFILE") {
      return report.entidadeId;
    }
    if (report.entidade === "REVIEW") {
      const review = await this.reputation.getReview(report.entidadeId);
      return review?.autorId ?? null;
    }
    return null;
  }

  /** Cria suspensão automática se o ofensor atingiu o limite e não está suspenso. */
  private async maybeAutoSuspend(offenderId: string, reportId: string): Promise<Suspension | null> {
    const active = await this.suspensions.activeForUser(offenderId);
    if (active) return null; // já suspenso: não empilha
    const strikes = await this.reports.countProcedenteForOffender(offenderId);
    if (!shouldAutoSuspend(strikes)) return null;

    const suspension = await this.suspensions.create({
      userId: offenderId,
      reportId,
      motivo: `Suspensão automática após ${strikes} denúncias procedentes.`,
      fimEm: suspensionEnd(new Date()).toISOString(),
    });
    await this.audit.record({
      atorUserId: null,
      acao: "SUSPENSAO_APLICADA",
      entidade: "user",
      entidadeId: offenderId,
      dados: { strikes, suspensaoId: suspension.id },
    });
    return suspension;
  }
}
