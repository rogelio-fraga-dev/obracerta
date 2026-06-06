/**
 * Lembretes de avaliação (roadmap §12). Após a obra CONCLUIR, lembramos cada lado
 * de avaliar o outro nos dias 1, 5 e 7 — se ainda não avaliou. Domínio puro: só os
 * dias e o cálculo do atraso; o agendamento (BullMQ) e o envio (NotificationProvider)
 * ficam na aplicação/infra. `reaproveita` o `speedup` do onboarding p/ testar rápido.
 */

const MS_PER_DAY = 86_400_000;

/** Dias após a conclusão em que o lembrete dispara. */
export const REVIEW_REMINDER_DAYS: readonly number[] = [1, 5, 7];

/** Atraso (ms) de um lembrete. `speedupFactor` acelera em dev/teste (1 = real). */
export function reminderDelayMs(dia: number, speedupFactor = 1): number {
  return Math.round((dia * MS_PER_DAY) / Math.max(speedupFactor, 1));
}
