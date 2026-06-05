import type { AvailabilitySlot, CalendarDay, CalendarWindow, ScheduleBlock } from "@obracerta/shared";

/**
 * Domínio puro da agenda (roadmap §4.2/§10). Projeta o calendário de 6 meses a
 * partir da grade semanal recorrente menos os bloqueios — nada é materializado
 * em tabela. Sem dependência de framework/ORM (camada de domínio).
 *
 * Convenção de fuso: a aritmética é feita em UTC e os horários "HH:MM" são
 * interpretados como minutos do dia UTC. Consistente e determinístico para os
 * testes; o tratamento de America/Sao_Paulo entra quando o agendamento real
 * (Fatia 2.2) precisar casar instantes com horário local.
 */

const MAX_PROJECTION_MONTHS = 6;
const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60_000;

type Range = [number, number];

/** "HH:MM" → minutos desde a meia-noite. */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

/** Minutos desde a meia-noite → "HH:MM" (zero-padded). */
export function minutesToHhmm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Subtrai faixas bloqueadas de uma janela `[início, fim]` (em minutos),
 * devolvendo as faixas livres restantes. Lida com sobreposição e bloqueios
 * que extrapolam a janela.
 */
export function subtractRanges(window: Range, blocked: readonly Range[]): Range[] {
  const [windowStart, windowEnd] = window;
  if (windowEnd <= windowStart) return [];

  const clamped = blocked
    .map(([start, end]): Range => [Math.max(start, windowStart), Math.min(end, windowEnd)])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  const free: Range[] = [];
  let cursor = windowStart;
  for (const [start, end] of clamped) {
    if (start > cursor) free.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < windowEnd) free.push([cursor, windowEnd]);
  return free;
}

/** Meia-noite UTC do dia de `date` (descarta a parte de horário). */
function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Projeta o calendário a partir da grade semanal e dos bloqueios. Para cada dia
 * no intervalo `[fromDate, fromDate + months)` (limitado a 6 meses), gera as
 * janelas livres das faixas daquele dia da semana. Dias sem grade ou totalmente
 * bloqueados são omitidos.
 */
export function projectCalendar(
  slots: readonly AvailabilitySlot[],
  blocks: readonly ScheduleBlock[],
  fromDate: Date,
  months = MAX_PROJECTION_MONTHS,
): CalendarDay[] {
  const cappedMonths = Math.min(Math.max(months, 0), MAX_PROJECTION_MONTHS);
  const start = toUtcMidnight(fromDate);
  const end = toUtcMidnight(fromDate);
  end.setUTCMonth(end.getUTCMonth() + cappedMonths);

  const blockInstants = blocks.map((b) => ({ inicio: Date.parse(b.inicio), fim: Date.parse(b.fim) }));

  const days: CalendarDay[] = [];
  for (const cursor = new Date(start); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const diaSemana = cursor.getUTCDay();
    const daySlots = slots.filter((s) => s.diaSemana === diaSemana);
    if (daySlots.length === 0) continue;

    const dayStartMs = cursor.getTime();
    const blockedMinutes = blockInstants
      .map(({ inicio, fim }): Range => [
        Math.max(0, (inicio - dayStartMs) / MS_PER_MINUTE),
        Math.min(MINUTES_PER_DAY, (fim - dayStartMs) / MS_PER_MINUTE),
      ])
      .filter(([s, e]) => e > s);

    const janelas: CalendarWindow[] = [];
    for (const slot of daySlots) {
      const free = subtractRanges(
        [hhmmToMinutes(slot.horaInicio), hhmmToMinutes(slot.horaFim)],
        blockedMinutes,
      );
      for (const [s, e] of free) {
        janelas.push({ horaInicio: minutesToHhmm(s), horaFim: minutesToHhmm(e) });
      }
    }
    if (janelas.length === 0) continue;

    days.push({ data: cursor.toISOString().slice(0, 10), diaSemana, janelas });
  }
  return days;
}

/** True se `interval` sobrepõe algum bloqueio (toque nas bordas não conta). */
export function hasConflict(
  blocks: ReadonlyArray<{ inicio: string; fim: string }>,
  interval: { inicio: string; fim: string },
): boolean {
  const start = Date.parse(interval.inicio);
  const end = Date.parse(interval.fim);
  return blocks.some((b) => Date.parse(b.inicio) < end && start < Date.parse(b.fim));
}
