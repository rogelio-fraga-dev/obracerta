import type { Report, ReportStatus, ReportTarget } from "@obracerta/shared";

/** Dados para registrar uma denúncia. */
export interface CreateReportData {
  denuncianteId: string | null;
  entidade: ReportTarget;
  entidadeId: string;
  motivo: string;
  detalhe: string | null;
}

/** Porta de saída das denúncias (moderação). */
export interface ReportRepository {
  create(data: CreateReportData): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  /** Move o status; quando `resolvido`, carimba `resolvido_em`. */
  setStatus(id: string, status: ReportStatus, resolvido: boolean): Promise<Report | null>;
  /** Fila de moderação: denúncias ainda abertas (mais antigas primeiro). */
  listOpen(): Promise<Report[]>;
  /**
   * Strikes procedentes atribuíveis a um usuário: denúncias PROCEDENTE contra ele
   * diretamente (USER/PROFILE) ou contra avaliações que ele escreveu (REVIEW).
   */
  countProcedenteForOffender(offenderId: string): Promise<number>;
}

export const REPORT_REPOSITORY = Symbol("REPORT_REPOSITORY");
