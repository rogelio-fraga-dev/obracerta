import { ReportStatus, SuspensionStatus } from "@obracerta/shared";

/**
 * Domínio puro da moderação (roadmap §13). Regras sem framework/ORM: janela de
 * ocultação precaucional (48h), transição de denúncia, gatilho de suspensão
 * automática por reincidência, duração da suspensão e regras de apelação.
 */

/** Janela (horas) em que o conteúdo denunciado fica oculto até a moderação decidir. */
export const HIDE_WINDOW_HOURS = 48;

/** Nº de strikes (denúncias procedentes) que dispara a suspensão automática. */
export const AUTO_SUSPEND_THRESHOLD = 3;

/** Duração (dias) da suspensão automática. */
export const SUSPENSION_DAYS = 7;

const MS_POR_HORA = 60 * 60 * 1000;
const MS_POR_DIA = 24 * MS_POR_HORA;

/** Instante até quando o conteúdo fica oculto por precaução (agora + 48h). */
export function precautionaryHideUntil(now: Date): Date {
  return new Date(now.getTime() + HIDE_WINDOW_HOURS * MS_POR_HORA);
}

/** Só denúncias ainda não decididas (ABERTA/EM_ANALISE) podem ser resolvidas. */
export function canResolveReport(status: ReportStatus): boolean {
  return status === ReportStatus.ABERTA || status === ReportStatus.EM_ANALISE;
}

/** Suspende automaticamente quando os strikes procedentes atingem o limite. */
export function shouldAutoSuspend(totalProcedentes: number): boolean {
  return totalProcedentes >= AUTO_SUSPEND_THRESHOLD;
}

/** Fim da suspensão automática (agora + 7 dias). */
export function suspensionEnd(now: Date): Date {
  return new Date(now.getTime() + SUSPENSION_DAYS * MS_POR_DIA);
}

/** Só uma suspensão ATIVA pode ser apelada. */
export function canAppeal(status: SuspensionStatus): boolean {
  return status === SuspensionStatus.ATIVA;
}

/**
 * Suspensão em vigor: status ATIVA e ainda dentro do prazo. `fimEm` nulo =
 * indeterminada (sempre em vigor até ser revogada). Expiração é preguiçosa
 * (avaliada na leitura), sem job dedicado.
 */
export function isSuspensionActive(
  status: SuspensionStatus,
  fimEm: Date | null,
  now: Date,
): boolean {
  if (status !== SuspensionStatus.ATIVA) return false;
  return fimEm === null || fimEm.getTime() > now.getTime();
}

/** Resolução da apelação: deferir revoga; indeferir mantém ativa. */
export function appealOutcome(grant: boolean): SuspensionStatus {
  return grant ? SuspensionStatus.REVOGADA : SuspensionStatus.ATIVA;
}

/**
 * A suspensão deve expirar automaticamente? Só ATIVA com prazo (`fimEm`) já vencido.
 * Indeterminada (`fimEm` nulo) nunca expira sozinha; só sai por revogação na apelação.
 */
export function canAutoLift(
  status: SuspensionStatus,
  fimEm: Date | null,
  now: Date,
): boolean {
  return status === SuspensionStatus.ATIVA && fimEm !== null && now.getTime() >= fimEm.getTime();
}
